'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Calendar as CalendarIcon, 
  AlertTriangle,
  CheckCircle,
  X,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Document {
  _id?: string;
  name: string;
  type: string;
  category: 'policy' | 'procedure' | 'training' | 'license' | 'certificate' | 'other';
  uploadedBy?: string;
  uploadedByName?: string;
  uploadDate?: string;
  expirationDate?: string;
  size?: number;
  url?: string;
  visibility?: 'public' | 'restricted';
  assignedTo?: { _id: string; name: string; email: string }[];
  departments?: string[];
}

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document | null;
  onSave: () => void;
}

export default function DocumentModal({ isOpen, onClose, document, onSave }: DocumentModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<Document>({
    name: '',
    type: '',
    category: 'other',
    visibility: 'public',
    assignedTo: [],
    departments: []
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [hasExpiration, setHasExpiration] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isViewing = !!document;
  const isAdmin = session?.user?.role === 'admin';
  const isOwner = document?.uploadedBy === session?.user?.id;
  const canEdit = isAdmin || isOwner;

  useEffect(() => {
    if (isOpen) {
      if (document) {
        setFormData(document);
        if (document.expirationDate) {
          setExpirationDate(new Date(document.expirationDate));
          setHasExpiration(true);
        } else {
          setExpirationDate(undefined);
          setHasExpiration(false);
        }
      } else {
        // Reset form for new document
        setFormData({
          name: '',
          type: '',
          category: 'other',
          visibility: 'public',
          assignedTo: [],
          departments: []
        });
        setFile(null);
        setExpirationDate(undefined);
        setHasExpiration(false);
      }
      
      // Fetch available users for assignment (only for admins)
      if (isAdmin) {
        fetchAvailableUsers();
      }
    }
  }, [isOpen, document, isAdmin]);

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFormData({
        ...formData,
        name: selectedFile.name,
        type: selectedFile.type || 'application/octet-stream'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isViewing && !file) {
      toast.error('Please select a file to upload');
      return;
    }

    const documentData = new FormData();
    documentData.append('name', formData.name);
    documentData.append('category', formData.category);
    
    if (hasExpiration && expirationDate) {
      documentData.append('expirationDate', expirationDate.toISOString());
    }

    // Add access control fields (only for admins and owners)
    if (isAdmin || isOwner) {
      documentData.append('visibility', formData.visibility || 'public');
      if (formData.assignedTo && formData.assignedTo.length > 0) {
        documentData.append('assignedTo', JSON.stringify(formData.assignedTo.map(user => user._id)));
      }
      if (formData.departments && formData.departments.length > 0) {
        documentData.append('departments', JSON.stringify(formData.departments));
      }
    }

    if (file) {
      documentData.append('file', file);
    }

    setLoading(true);

    try {
      const url = isViewing ? `/api/documents/${document?._id}` : '/api/documents';
      const method = isViewing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: documentData,
      });

      if (response.ok) {
        toast.success(isViewing ? 'Document updated successfully' : 'Document uploaded successfully');
        onSave();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save document');
      }
    } catch (error) {
      toast.error('An error occurred while saving the document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!document?._id) return;

    if (!confirm('Are you sure you want to delete this document?')) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/documents/${document._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        onSave();
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document?._id) return;

    try {
      const response = await fetch(`/api/documents/${document._id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.name;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'policy': 'Policy',
      'procedure': 'Procedure',
      'training': 'Training',
      'license': 'License',
      'certificate': 'Certificate',
      'other': 'Other'
    };
    return labels[category] || category;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpirationStatus = () => {
    if (!expirationDate) return 'no-expiration';
    
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 30) return 'expiring-soon';
    return 'active';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isViewing ? 'Document Details' : 'Upload New Document'}
            {document && (
              <Badge 
                variant={document.category === 'license' || document.category === 'certificate' ? 'default' : 'secondary'}
                className="ml-2"
              >
                {getCategoryLabel(document.category)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isViewing 
              ? 'View document details and make updates' 
              : 'Upload a new compliance document to your organization'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-hidden">
          {/* File Upload (only for new documents) */}
          {!isViewing && (
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium">
                Select File *
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                    <p className="text-sm text-muted-foreground text-center break-words">
                      or drag and drop your file here
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              {file && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg overflow-hidden">
                  <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium truncate" title={file.name}>{file.name}</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Document Info (for viewing existing documents) */}
          {isViewing && document && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="font-medium truncate" title={document.name}>{document.name}</h3>
                  <p className="text-sm text-muted-foreground break-words">
                    {document.size && formatFileSize(document.size)} • {document.type}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              {document.uploadDate && (
                <div className="text-sm text-muted-foreground break-words">
                  Uploaded on {format(new Date(document.uploadDate), 'PPP')} by {document.uploadedByName}
                </div>
              )}
            </div>
          )}

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Document Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter document name..."
              required
              disabled={isViewing && !canEdit}
              className="w-full"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value as Document['category'] })}
              disabled={isViewing && !canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="training">Training Material</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Access Control (only for admins and document owners) */}
          {(isAdmin || isOwner) && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Access Control</Label>
                <Badge variant="secondary" className="text-xs">Admin/Owner Only</Badge>
              </div>
              
              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-sm font-medium">
                  Visibility
                </Label>
                <Select 
                  value={formData.visibility || 'public'} 
                  onValueChange={(value: 'public' | 'restricted') => setFormData({ ...formData, visibility: value })}
                  disabled={isViewing && !canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    <SelectItem value="public">
                      Public - {isAdmin ? "All users can access" : "Only admins and you can access"}
                    </SelectItem>
                    <SelectItem value="restricted">Restricted - Only assigned users can access</SelectItem>
                  </SelectContent>
                </Select>
                {!isAdmin && (
                  <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>Note:</strong> Public documents you upload will only be visible to you and administrators. 
                    Only administrators can make documents visible to all users.
                  </div>
                )}
              </div>

              {/* Assigned Users (only if restricted) */}
              {formData.visibility === 'restricted' && isAdmin && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Assigned Users
                  </Label>
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <div key={user._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${user._id}`}
                          checked={formData.assignedTo?.some(assignedUser => assignedUser._id === user._id) || false}
                          onChange={(e) => {
                            const currentAssigned = formData.assignedTo || [];
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                assignedTo: [...currentAssigned, user]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                assignedTo: currentAssigned.filter(assignedUser => assignedUser._id !== user._id)
                              });
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`user-${user._id}`} className="text-sm">
                          {user.name} ({user.email})
                        </Label>
                      </div>
                    ))}
                    {availableUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground">No users available for assignment</p>
                    )}
                  </div>
                </div>
              )}

              {formData.visibility === 'restricted' && !isAdmin && (
                <div className="p-3 bg-muted/50 border border-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    User assignments can only be managed by administrators.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Access Info for non-admin users */}
          {!isAdmin && !isOwner && document && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg border">
              <Label className="text-sm font-medium">Document Access</Label>
              <div className="flex items-center gap-2">
                <Badge variant={document.visibility === 'public' ? 'default' : 'secondary'}>
                  {document.visibility === 'public' ? 'Shared by Admin' : 'Restricted Access'}
                </Badge>
                {document.visibility === 'restricted' && (
                  <span className="text-sm text-muted-foreground">
                    You have specific access to this document
                  </span>
                )}
                {document.visibility === 'public' && (
                  <span className="text-sm text-muted-foreground">
                    Administrator made this document available to you
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Expiration Date */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasExpiration"
                checked={hasExpiration}
                onChange={(e) => {
                  setHasExpiration(e.target.checked);
                  if (!e.target.checked) {
                    setExpirationDate(undefined);
                  }
                }}
                className="h-4 w-4 rounded border-gray-300"
                disabled={isViewing && !canEdit}
              />
              <Label htmlFor="hasExpiration" className="text-sm font-medium">
                This document has an expiration date
              </Label>
            </div>

            {hasExpiration && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Expiration Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expirationDate && "text-muted-foreground"
                      )}
                      disabled={isViewing && !canEdit}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expirationDate ? format(expirationDate, "PPP") : "Pick an expiration date"}
                    </Button>
                  </PopoverTrigger>
                  {!(isViewing && !canEdit) && (
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  )}
                </Popover>

                {/* Expiration Warning */}
                {expirationDate && getExpirationStatus() === 'expiring-soon' && (
                  <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <p className="text-sm text-warning">
                      This document will expire within 30 days.
                    </p>
                  </div>
                )}

                {expirationDate && getExpirationStatus() === 'expired' && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">
                      This document has expired and needs to be renewed.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <div className="flex-1">
              {isViewing && (isAdmin || isOwner) && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Delete Document
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              {!isViewing && (
                <Button 
                  type="submit" 
                  disabled={loading || !formData.name || !file}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {loading ? 'Uploading...' : 'Upload Document'}
                </Button>
              )}
              {isViewing && canEdit && (
                <Button 
                  type="submit" 
                  disabled={loading || !formData.name}
                  className="btn-primary flex-1 sm:flex-none"
                >
                  {loading ? 'Saving...' : 'Update Document'}
                </Button>
              )}
              {isViewing && !canEdit && (
                <div className="flex-1 sm:flex-none">
                  <p className="text-sm text-muted-foreground italic">
                    Read-only access - only admins and document owners can make changes
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
