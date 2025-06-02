"use client"

import { useState } from "react"
import { Clock, Calendar, Zap, Star, Users, Building, Check, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PricingPage() {
  const [selectedTab, setSelectedTab] = useState("hourly")

  const hourlyPlans = [
    {
      name: "Quick Test",
      icon: <Clock className="h-6 w-6" />,
      price: 2.99,
      duration: "1 hour",
      description: "Perfect for quick experiments and testing",
      features: ["Full access to all models", "100 API calls", "Standard rate limits", "Basic support"],
      useCases: ["Testing a model before committing", "Quick prototype development", "One-time data processing"],
      cta: "Start Now",
      popular: false,
    },
    {
      name: "Power Hour",
      icon: <Zap className="h-6 w-6" />,
      price: 9.99,
      duration: "4 hours",
      description: "Ideal for focused development sessions",
      features: [
        "Full access to all models",
        "500 API calls",
        "Increased rate limits",
        "Priority support",
        "Save your work for later",
      ],
      useCases: ["Hackathon sprints", "Focused development sessions", "Small batch processing"],
      cta: "Get Started",
      popular: true,
    },
    {
      name: "Day Pass",
      icon: <Calendar className="h-6 w-6" />,
      price: 19.99,
      duration: "24 hours",
      description: "Complete a full day of development",
      features: [
        "Full access to all models",
        "2,000 API calls",
        "High rate limits",
        "Priority support",
        "Save configurations",
        "Access to beta features",
      ],
      useCases: ["Day-long development", "Larger data processing jobs", "Client presentations"],
      cta: "Get Day Pass",
      popular: false,
    },
  ]

  const dailyPlans = [
    {
      name: "Weekend Project",
      icon: <Calendar className="h-6 w-6" />,
      price: 29.99,
      duration: "3 days",
      description: "Perfect for weekend projects and hackathons",
      features: [
        "Full access to all models",
        "5,000 API calls",
        "High rate limits",
        "Priority support",
        "Save configurations",
        "Access to beta features",
      ],
      useCases: ["Weekend hackathons", "Short-term projects", "Proof of concepts"],
      cta: "Get 3-Day Pass",
      popular: true,
    },
    {
      name: "Week Sprint",
      icon: <Calendar className="h-6 w-6" />,
      price: 59.99,
      duration: "7 days",
      description: "For week-long sprints and projects",
      features: [
        "Full access to all models",
        "15,000 API calls",
        "Maximum rate limits",
        "Priority support",
        "Save configurations",
        "Access to beta features",
        "Team collaboration",
      ],
      useCases: ["Development sprints", "Project milestones", "Short-term team projects"],
      cta: "Start 7-Day Sprint",
      popular: false,
    },
  ]

  const monthlyPlans = [
    {
      name: "Basic",
      icon: <Star className="h-6 w-6" />,
      price: 49.99,
      duration: "Monthly",
      description: "For ongoing individual projects",
      features: [
        "Full access to all models",
        "50,000 API calls/month",
        "Standard rate limits",
        "Priority support",
        "Save configurations",
      ],
      useCases: ["Personal projects", "Ongoing development", "Regular usage"],
      cta: "Subscribe Monthly",
      popular: false,
    },
    {
      name: "Team",
      icon: <Users className="h-6 w-6" />,
      price: 199.99,
      duration: "Monthly",
      description: "For teams with ongoing projects",
      features: [
        "Full access to all models",
        "250,000 API calls/month",
        "Maximum rate limits",
        "24/7 priority support",
        "Team management",
        "Custom model fine-tuning",
        "Advanced analytics",
      ],
      useCases: ["Team projects", "Production applications", "Enterprise solutions"],
      cta: "Team Subscribe",
      popular: true,
    },
    {
      name: "Enterprise",
      icon: <Building className="h-6 w-6" />,
      price: "Custom",
      duration: "Monthly",
      description: "For large organizations with custom requirements",
      features: [
        "Unlimited API calls",
        "Custom model deployment",
        "Dedicated infrastructure",
        "24/7 enterprise support",
        "Custom rate limits",
        "Advanced security features",
        "On-premise deployment options",
      ],
      useCases: ["Enterprise integration", "High-volume applications", "Custom solutions"],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  const getPlans = () => {
    switch (selectedTab) {
      case "hourly":
        return hourlyPlans
      case "daily":
        return dailyPlans
      case "monthly":
        return monthlyPlans
      default:
        return hourlyPlans
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Pay Only For What You Need</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From quick experiments to long-term projects, choose the perfect plan for your specific use case and
              timeline.
            </p>

            <div className="flex flex-col items-center space-y-4">
              <Tabs
                defaultValue="hourly"
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="w-full max-w-md"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hourly" className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Hourly</span>
                  </TabsTrigger>
                  <TabsTrigger value="daily" className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Daily</span>
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Monthly</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-sm text-muted-foreground">Select your preferred subscription duration</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {getPlans().map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">{plan.icon}</div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    {typeof plan.price === "number" ? `$${plan.price}` : plan.price}
                    <span className="text-lg font-normal text-muted-foreground">/{plan.duration.toLowerCase()}</span>
                  </div>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  {plan.cta}
                </Button>

                <div className="space-y-3">
                  <h4 className="font-medium">Features:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    Ideal Use Cases:
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">Recommended scenarios for this subscription duration</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>
                  <ul className="space-y-2">
                    {plan.useCases.map((useCase) => (
                      <li key={useCase} className="text-sm text-muted-foreground">
                        • {useCase}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: "How do short-term subscriptions work?",
                answer:
                  "Our short-term subscriptions start immediately upon purchase and last for the specified duration. You'll have full access to all features during that time, with no automatic renewal.",
              },
              {
                question: "Can I extend my subscription?",
                answer:
                  "Yes! You can extend your subscription at any time. If you need more time, you can purchase additional hours or days, or upgrade to a longer subscription plan.",
              },
              {
                question: "What happens when my subscription ends?",
                answer:
                  "Your access to the API will end when your subscription period is over. However, we save your configurations and work for 30 days, so you can easily pick up where you left off if you subscribe again.",
              },
              {
                question: "Can I switch between subscription types?",
                answer:
                  "Yes, you can switch between hourly, daily, and monthly plans as your needs change. Any remaining time on your current subscription will be prorated toward your new plan.",
              },
              {
                question: "Are there any hidden fees?",
                answer:
                  "No hidden fees! You pay only for the subscription duration you choose. All features included in your plan are available for the full duration with no extra charges.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "We offer refunds for monthly plans within the first 7 days. Due to their short-term nature, hourly and daily plans are non-refundable once activated.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Usage-Based Add-Ons */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Additional Usage</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Need more API calls? Add extra capacity to any subscription at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "API Calls",
                price: "$5.00",
                amount: "1,000 calls",
                description: "Add more API calls to any subscription",
              },
              {
                name: "Rate Limit Boost",
                price: "$10.00",
                amount: "24 hours",
                description: "Double your rate limits for intensive tasks",
              },
              {
                name: "Storage Extension",
                price: "$3.00",
                amount: "30 days",
                description: "Keep your configurations and data longer",
              },
            ].map((addon) => (
              <Card key={addon.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <div className="text-2xl font-bold text-primary">{addon.price}</div>
                  <p className="text-sm text-muted-foreground">per {addon.amount}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                  <Button variant="outline" className="w-full">
                    Add to Subscription
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
