"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PageBuilder } from "@/components/admin/page-builder/PageBuilder"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Plus, Edit, Trash2, Eye } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string | null
  categoryId: string | null
  subcategoryId: string | null
  pageComponents: any[]
}

interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  categoryId: string
}

export default function PageBuilderPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [pageComponents, setPageComponents] = useState<any[]>([])
  
  // New service form
  const [newServiceName, setNewServiceName] = useState("")
  const [newServiceDescription, setNewServiceDescription] = useState("")
  const [newServiceCategory, setNewServiceCategory] = useState("")
  const [newServiceSubcategory, setNewServiceSubcategory] = useState("")
  const [showNewServiceForm, setShowNewServiceForm] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    fetchServices()
    fetchCategories()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service)
    setPageComponents(service.pageComponents || [])
    setEditMode(true)
    setShowNewServiceForm(false)
  }

  const handleSaveComponents = async () => {
    if (!selectedService) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/services/${selectedService.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageComponents: pageComponents
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Page components saved successfully",
        })
        
        // Update the service in the list
        setServices(prev => prev.map(service => 
          service.id === selectedService.id 
            ? { ...service, pageComponents: pageComponents }
            : service
        ))
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving components:', error)
      toast({
        title: "Error",
        description: "Failed to save page components",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNewService = async () => {
    if (!newServiceName.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newServiceName,
          description: newServiceDescription || null,
          categoryId: newServiceCategory || null,
          subcategoryId: newServiceSubcategory || null,
          pageComponents: pageComponents
        }),
      })

      if (response.ok) {
        const newService = await response.json()
        setServices(prev => [...prev, newService])
        setSelectedService(newService)
        setNewServiceName("")
        setNewServiceDescription("")
        setNewServiceCategory("")
        setNewServiceSubcategory("")
        setShowNewServiceForm(false)
        
        toast({
          title: "Success",
          description: "Service created successfully",
        })
      } else {
        throw new Error('Failed to create service')
      }
    } catch (error) {
      console.error('Error creating service:', error)
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getAvailableSubcategories = () => {
    if (!newServiceCategory) return []
    const category = categories.find(cat => cat.id === newServiceCategory)
    return category?.subcategories || []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Builder</h1>
          <p className="text-muted-foreground">
            Create and edit dynamic pages for your services
          </p>
        </div>
        <Button 
          onClick={() => {
            setShowNewServiceForm(true)
            setSelectedService(null)
            setEditMode(true)
            setPageComponents([])
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Service Page
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Services</CardTitle>
              <CardDescription>
                Select a service to edit its page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedService?.id === service.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {service.pageComponents?.length || 0} components
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`/services/${service.id}`, '_blank')
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Page Builder */}
        <div className="lg:col-span-2">
          {editMode ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {showNewServiceForm ? 'Create New Service' : `Edit: ${selectedService?.name}`}
                    </CardTitle>
                    <CardDescription>
                      {showNewServiceForm 
                        ? 'Create a new service with custom page components'
                        : 'Drag and drop components to build your page'
                      }
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={showNewServiceForm ? handleCreateNewService : handleSaveComponents}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {showNewServiceForm ? 'Create Service' : 'Save Changes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showNewServiceForm && (
                  <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serviceName">Service Name</Label>
                        <Input
                          id="serviceName"
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          placeholder="Enter service name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={newServiceCategory} onValueChange={setNewServiceCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Category</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {newServiceCategory && newServiceCategory !== "none" && (
                      <div>
                        <Label htmlFor="subcategory">Subcategory</Label>
                        <Select value={newServiceSubcategory} onValueChange={setNewServiceSubcategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Subcategory</SelectItem>
                            {getAvailableSubcategories().map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newServiceDescription}
                        onChange={(e) => setNewServiceDescription(e.target.value)}
                        placeholder="Enter service description"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                
                <PageBuilder
                  components={pageComponents}
                  onComponentsChange={setPageComponents}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Service Selected</h3>
                  <p className="text-muted-foreground">
                    Select a service from the list to edit its page, or create a new service.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
