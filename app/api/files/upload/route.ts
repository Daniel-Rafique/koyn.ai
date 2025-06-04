import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// File upload configuration
const UPLOAD_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: {
    models: [
      'application/octet-stream',
      'application/x-pytorch',
      'application/x-tensorflow',
      'application/x-onnx',
      'application/zip',
      'application/x-tar',
      'application/gzip'
    ],
    images: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
    documents: [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json'
    ]
  },
  uploadPath: join(process.cwd(), 'uploads')
}

async function uploadHandler(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('type') as string || 'models'
    const modelId = formData.get('modelId') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('public') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = UPLOAD_CONFIG.allowedMimeTypes[fileType as keyof typeof UPLOAD_CONFIG.allowedMimeTypes]
    if (!allowedTypes || !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes?.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Check if user has permission to upload to this model
    if (modelId) {
      const model = await prisma.model.findUnique({
        where: { id: modelId },
        include: { creator: { include: { user: true } } }
      })

      if (!model) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        )
      }

      if (model.creator.user.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        )
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const uploadDir = join(UPLOAD_CONFIG.uploadPath, fileType, session.user.id)
    const filePath = join(uploadDir, uniqueFileName)

    // Create upload directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true })

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Calculate file hash for deduplication
    const crypto = require('crypto')
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')

    // Check for existing file with same hash
    const existingFile = await prisma.file.findFirst({
      where: { 
        hash: fileHash,
        uploadedBy: session.user.id
      }
    })

    if (existingFile) {
      // Delete the newly uploaded file since it's a duplicate
      const fs = require('fs').promises
      await fs.unlink(filePath)

      return NextResponse.json({
        success: true,
        data: {
          file: existingFile,
          message: 'File already exists (duplicate detected)'
        }
      })
    }

    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        url: `/api/files/${uniqueFileName}`,
        hash: fileHash,
        type: fileType,
        uploadedBy: session.user.id,
        modelId: modelId || null,
        description: description || null,
        isPublic: isPublic,
        metadata: {
          uploadedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      }
    })

    // Update model file references if uploading to a model
    if (modelId && fileType === 'models') {
      console.log(`File ${fileRecord.id} linked to model ${modelId}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        file: {
          id: fileRecord.id,
          name: fileRecord.name,
          size: fileRecord.size,
          type: fileRecord.type,
          url: fileRecord.url,
          uploadedAt: fileRecord.createdAt
        }
      },
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(rateLimiters.general, uploadHandler)

// GET - List user's uploaded files
async function listFilesHandler(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const modelId = searchParams.get('modelId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: any = {
      uploadedBy: session.user.id
    }

    if (type) whereClause.type = type
    if (modelId) whereClause.modelId = modelId

    const files = await prisma.file.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        size: true,
        type: true,
        url: true,
        description: true,
        isPublic: true,
        createdAt: true,
        model: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.file.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      data: {
        files,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + files.length < totalCount
        }
      }
    })

  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(rateLimiters.general, listFilesHandler) 