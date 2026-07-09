'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Send, Eye, MoreVertical } from 'lucide-react'
import { mockCampaigns } from '@/lib/mock-data'

export default function CampaignsPage() {
  const [campaigns] = useState(mockCampaigns)
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState(1)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create and manage customer broadcast campaigns</p>
        </div>
        <button
          onClick={() => {
            setShowModal(true)
            setModalStep(1)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Campaign Name</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Type</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Status</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Recipients</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Sent</th>
              <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Created</th>
              <th className="px-6 py-3 text-right text-sm font-bold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.map((campaign) => {
              const sentPercentage = campaign.recipientCount > 0 
                ? Math.round((campaign.sentCount / campaign.recipientCount) * 100)
                : 0
              
              return (
                <tr key={campaign.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">{campaign.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{getTypeLabel(campaign.type)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                        campaign.status
                      )}`}
                    >
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-foreground">{campaign.recipientCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${sentPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground min-w-fit">
                        {sentPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{campaign.createdAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {campaign.status === 'draft' && (
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="More">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Create New Campaign</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex gap-4 mb-6">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full ${
                    step <= modalStep ? 'bg-accent' : 'bg-secondary'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Campaign Details */}
            {modalStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Sale 2024"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Campaign Type</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                    <option>Broadcast</option>
                    <option>Targeted</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Target Audience */}
            {modalStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Target Audience</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                    <option>All Customers</option>
                    <option>VIP Customers</option>
                    <option>New Customers</option>
                    <option>Inactive Users</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Schedule</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Message Content */}
            {modalStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Message Template</label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary">
                    <option>Select a template...</option>
                    <option>Order Confirmation</option>
                    <option>Shipment Notification</option>
                    <option>Promotional Offer</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Message Preview</label>
                  <textarea
                    rows={4}
                    defaultValue="شكراً لاختيارك منتجاتنا! استمتع بخصم خاص 20% على جميع الطلبات اليوم."
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground bg-secondary"
                  />
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (modalStep > 1) {
                    setModalStep(modalStep - 1)
                  } else {
                    setShowModal(false)
                  }
                }}
                className="flex-1 px-4 py-2 text-foreground border border-border rounded-lg hover:bg-secondary transition-colors font-medium"
              >
                {modalStep === 1 ? 'Cancel' : 'Previous'}
              </button>
              <button
                onClick={() => {
                  if (modalStep < 3) {
                    setModalStep(modalStep + 1)
                  } else {
                    setShowModal(false)
                  }
                }}
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {modalStep === 3 ? (
                  <>
                    <Send className="w-4 h-4" />
                    Create Campaign
                  </>
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
