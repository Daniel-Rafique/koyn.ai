import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/database'
import { readFile } from 'fs/promises'
import { join } from 'path'

// GET - Serve file
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params

    // Find file in database
    const file = await prisma.file.findFirst({
      where: {
        OR: [
          { name: filename },
          { url: { endsWith: filename } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        model: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    const session = await getServerSession()
    
    // Public files are accessible to everyone
    if (!file.isPublic) {
      // Private files require authentication
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check if user owns the file or has access to the model
      const hasAccess = 
        file.uploadedBy === session.user.id || // Owner
        (file.model && await checkModelAccess(session.user.id, file.model.id)) // Model access

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Read and serve file
    try {
      const fileBuffer = await readFile(file.path)
      
      return new NextResponse(fileBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': file.mimeType,
          'Content-Length': file.size.toString(),
          'Content-Disposition': `attachment; filename="${file.originalName}"`,
          'Cache-Control': 'public, max-age=31536000', // 1 year cache
          'ETag': file.hash,
          'Last-Modified': file.updatedAt.toUTCString()
        }
      })
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json(
        { error: 'File not accessible' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

// Helper function to check if user has access to a model
async function checkModelAccess(userId: string, modelId: string): Promise<boolean> {
  try {
    // Check if user is the model creator
    const model = await prisma.model.findFirst({
      where: {
        id: modelId,
        creator: {
          user: {
            id: userId
          }
        }
      }
    })

    if (model) return true

    // Check if user has an active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        modelId,
        status: 'ACTIVE'
      }
    })

    return !!subscription
  } catch (error) {
    console.error('Error checking model access:', error)
    return false
  }
}

// DELETE - Delete file (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { filename } = params

    // Find file
    const file = await prisma.file.findFirst({
      where: {
        OR: [
          { name: filename },
          { url: { endsWith: filename } }
        ]
      }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (file.uploadedBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    try {
      const fs = require('fs').promises
      await fs.unlink(file.path)
    } catch (fsError) {
      console.warn('Could not delete physical file:', fsError)
      // Continue with database deletion even if file doesn't exist on disk
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: file.id }
    })

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
} 