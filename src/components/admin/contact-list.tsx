"use client"

import { useState } from "react"
import { Eye, Mail, Trash2, Calendar, User, MessageSquare, X, Send, Info } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mockContacts } from "@/lib/mockData"

export interface Contact {
  id: number
  name: string
  email: string
  subject: string
  message: string
  updatedAt: string
  Status: string
}

// Fetch contacts
const fetchContacts = async (): Promise<Contact[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockContacts;
}

// Delete contact
const deleteContact = async (id: number): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, you would filter out the deleted contact here
  // For mock data, we'll just log it
  console.log(`Contact ${id} deleted`);
}

export function ContactList() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isMailFormOpen, setIsMailFormOpen] = useState(false)
  const [message, setMessage] = useState("")

  const queryClient = useQueryClient()

  // Fetch contacts
  const { data: contacts, isLoading, error } = useQuery<Contact[], Error>({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  })

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      // In a real app, we would invalidate the query to refetch the data
      // For mock data, we'll just refetch the contacts
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
  if (error) return <div className="text-red-500 p-4 bg-red-100 rounded-lg flex items-center"><Info className="mr-2" /> Error: {error.message}</div>

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onError: (error) => {
        console.error("Failed to delete contact:", error)
      },
    })
  }

  const handleMailClick = (contact: Contact) => {
    setIsMailFormOpen(true)
    setSelectedContact(contact)
  }

  const handleSendMessage = async () => {
    if (selectedContact) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real app, we would update the contact status here
        console.log(`Message sent to ${selectedContact.email}: ${message}`);
        
        setMessage("")
        setIsMailFormOpen(false)
        
        // Invalidate the query to refresh the data
        queryClient.invalidateQueries({ queryKey: ["contacts"] })
      } catch (error) {
        console.error("Error sending message:", error)
      }
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "New":
        return "bg-green-100 text-green-800 border border-green-200"
      case "Responded":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "Closed":
        return "bg-gray-100 text-gray-800 border border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts?.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{contact.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Mail size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">{contact.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <MessageSquare size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500 truncate max-w-xs">{contact.message}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-500">{contact.updatedAt.split("T")[0]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(contact.Status)}`}>
                    {contact.Status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedContact(contact)}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleMailClick(contact)}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                      title="Send Message"
                    >
                      <Mail size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mail Form */}
      {isMailFormOpen && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full backdrop-blur-sm" onClick={() => setIsMailFormOpen(false)}>
          <div className="relative top-20 mx-auto p-6 border w-[500px] shadow-xl rounded-xl bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Message to {selectedContact.name}</h3>
              <button onClick={() => setIsMailFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <textarea
              className="w-full border border-gray-200 p-3 rounded-lg mb-4 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your message..."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            
            <div className="flex justify-end space-x-3">
              <button
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setIsMailFormOpen(false)}
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                onClick={handleSendMessage}
              >
                <Send size={16} className="mr-2" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {selectedContact && !isMailFormOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full backdrop-blur-sm"
          onClick={() => setSelectedContact(null)}
        >
          <div
            className="relative top-20 mx-auto p-6 border w-[500px] shadow-xl rounded-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Contact Details</h3>
              <button onClick={() => setSelectedContact(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <User size={16} className="text-gray-400 mr-3" />
                <span className="text-sm text-gray-700">Name: {selectedContact.name}</span>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="text-gray-400 mr-3" />
                <span className="text-sm text-gray-700">Email: {selectedContact.email}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-400 mr-3" />
                <span className="text-sm text-gray-700">Date: {selectedContact.updatedAt.split("T")[0]}</span>
              </div>
              <div className="flex items-center">
                <Info size={16} className="text-gray-400 mr-3" />
                <span className="text-sm text-gray-700">Status: {selectedContact.Status}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Message:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedContact.message}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}