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
import { Loader2, Save, Plus, Edit, Trash2, Eye, Search, Filter, Sparkles, Layout } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  description: string | null
  categoryId: string | null
  subcategoryId: string | null
  pageComponents: any[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
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

export default function EnhancedPageBuilderPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [pageComponents, setPageComponents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // New service form
  const [newServiceName, setNewServiceName] = useState("")
  const [newServiceDescription, setNewServiceDescription] = useState("")
  const [newServiceCategory, setNewServiceCategory] = useState("")
  const [newServiceSubcategory, setNewServiceSubcategory] = useState("")
  const [newServiceActive, setNewServiceActive] = useState(true)
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
          className: "bg-green-50 border-green-200",
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
    if (!newServiceName.trim()) {
      toast({
        title: "Required",
        description: "Service name is required",
        variant: "destructive",
      })
      return
    }

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
          pageComponents: pageComponents,
          isActive: newServiceActive
        }),
      })

      if (response.ok) {
        const newService = await response.json()
        setServices(prev => [...prev, newService])
        setSelectedService(newService)
        resetNewServiceForm()
        toast({
          title: "Success",
          description: "Service created successfully",
          className: "bg-green-50 border-green-200",
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

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== serviceId))
        if (selectedService?.id === serviceId) {
          setSelectedService(null)
          setEditMode(false)
          setPageComponents([])
        }
        toast({
          title: "Success",
          description: "Service deleted successfully",
          className: "bg-green-50 border-green-200",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      })
    }
    setShowDeleteDialog(null)
  }

  const resetNewServiceForm = () => {
    setNewServiceName("")
    setNewServiceDescription("")
    setNewServiceCategory("")
    setNewServiceSubcategory("")
    setNewServiceActive(true)
    setShowNewServiceForm(false)
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || service.categoryId === filterCategory
    return matchesSearch && matchesCategory
  })

  const getAvailableSubcategories = () => {
    if (!newServiceCategory) return []
    const category = categories.find(cat => cat.id === newServiceCategory)
    return category?.subcategories || []
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || "Uncategorized"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-primary/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Page Builder
            </h1>
            <p className="text-muted-foreground mt-2">
              Design beautiful service pages with our visual builder
            </p>
          </div>
          <Dialog open={showNewServiceForm} onOpenChange={setShowNewServiceForm}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Create Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Create New Service
                </DialogTitle>
                <DialogDescription>
                  Set up your service details and start building the page
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceName" className="text-base font-semibold">
                      Service Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serviceName"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g., Premium Web Design"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-base font-semibold">Category</Label>
                    <Select value={newServiceCategory} onValueChange={setNewServiceCategory}>
                      <SelectTrigger className="mt-1">
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
                    <Label htmlFor="subcategory" className="text-base font-semibold">Subcategory</Label>
                    <Select value={newServiceSubcategory} onValueChange={setNewServiceSubcategory}>
                      <SelectTrigger className="mt-1">
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
                  <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={newServiceDescription}
                    onChange={(e) => setNewServiceDescription(e.target.value)}
                    placeholder="Describe what this service offers..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                  <div>
                    <Label htmlFor="service-active" className="text-base font-semibold">Service Status</Label>
                    <p className="text-sm text-muted-foreground">Set service as active immediately</p>
                  </div>
                  <Switch
                    id="service-active"
                    checked={newServiceActive}
                    onCheckedChange={setNewServiceActive}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetNewServiceForm}>Cancel</Button>
                <Button onClick={handleCreateNewService} disabled={saving || !newServiceName.trim()}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Service
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Service List with Filters */}
          <Card className="xl:col-span-1 border-none shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Services</CardTitle>
                  <CardDescription className="mt-1">Manage your service pages</CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {filteredServices.length} total
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              {/* Services List */}
              <ScrollArea className="h-[600px] pr-2">
                <div className="space-y-3">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className={cn(
                        "group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                        selectedService?.id === service.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-transparent hover:border-border hover:shadow-sm bg-white/50'
                      )}
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {service.description || 'No description provided'}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {service.pageComponents?.length || 0} components
                            </Badge>
                            {service.categoryId && (
                              <Badge variant="secondary" className="text-xs">
                                {getCategoryName(service.categoryId)}
                              </Badge>
                            )}
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              service.isActive ? "bg-green-500" : "bg-gray-400"
                            )} />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`/services/${service.id}`, '_blank')
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDeleteDialog(service.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredServices.length === 0 && (
                    <div className="text-center py-12">
                      <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No services found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Page Builder */}
          <div className="xl:col-span-2">
            {editMode ? (
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Edit className="h-6 w-6 text-primary" />
                        {selectedService?.name || "New Service"}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Design your page with drag-and-drop components
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="show-preview" className="text-sm">Preview</Label>
                        <Switch
                          id="show-preview"
                          checked={showPreview}
                          onCheckedChange={setShowPreview}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSaveComponents}
                        disabled={saving}
                        size="lg"
                        className="gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="builder" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                      <TabsTrigger value="builder">Builder</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="builder" className="mt-6">
                      <div className={cn(
                        "transition-all duration-300",
                        showPreview && "opacity-50 pointer-events-none"
                      )}>
                        <PageBuilder
                          components={pageComponents}
                          onComponentsChange={setPageComponents}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="settings" className="mt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Service Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Service Name</Label>
                              <Input value={selectedService?.name || ""} disabled className="mt-1" />
                            </div>
                            <div>
                              <Label>Category</Label>
                              <Input value={selectedService?.categoryId ? getCategoryName(selectedService.categoryId) : "None"} disabled className="mt-1" />
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Page Settings</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>SEO Meta Title</Label>
                                <p className="text-sm text-muted-foreground">Customize the page title for search engines</p>
                              </div>
                              <Input className="max-w-xs" placeholder="Page title..." />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <Label>SEO Meta Description</Label>
                                <p className="text-sm text-muted-foreground">Description shown in search results</p>
                              </div>
                              <Textarea className="max-w-xs" rows={2} placeholder="Page description..." />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-lg">
                <CardContent className="flex items-center justify-center min-h-[600px]">
                  <div className="text-center max-w-md">
                    <div className="relative">
                      <Layout className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                      <div className="absolute inset-0 h-20 w-20 animate-pulse bg-primary/10 rounded-full blur-xl"></div>
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Welcome to Page Builder</h3>
                    <p className="text-muted-foreground mb-6">
                      Select a service from the list to start editing, or create a new service page from scratch.
                    </p>
                    <Button 
                      size="lg"
                      onClick={() => {
                        setShowNewServiceForm(true)
                        setSelectedService(null)
                        setEditMode(true)
                        setPageComponents([])
                      }}
                      className="gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Create First Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone and will permanently remove the service and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDeleteService(showDeleteDialog)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}