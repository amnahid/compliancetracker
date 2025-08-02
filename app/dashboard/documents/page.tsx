'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Calendar,
  AlertTriangle, 
  CheckCircle,
  Download,
  Edit,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import DocumentModal from '@/components/dashboard/DocumentModal';

interface Document {
  _id: string;
  name: string;
  type: string;
  category: 'policy' | 'procedure' | 'training' | 'license' | 'certificate' | 'other';
  uploadedBy: string;
  uploadedByName: string;
  uploadDate: string;
  expirationDate?: string;
  size: number;
  url: string;
  status: 'active' | 'expired' | 'expiring-soon';
  visibility?: 'public' | 'restricted';
  assignedTo?: { _id: string; name: string; email: string }[];
  departments?: string[];
}

export default function DocumentManagement() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccessBadge = (doc: Document) => {
    const isCurrentUserUploader = doc.uploadedBy === session?.user?.id;
    const isAdmin = session?.user?.role === 'admin';
    
    if (isCurrentUserUploader) {
      return {
        text: doc.visibility === 'public' ? 'Your Document' : 'Private',
        variant: 'default' as const
      };
    }
    
    if (doc.visibility === 'public') {
      return {
        text: isAdmin ? 'Public' : 'Shared by Admin',
        variant: 'default' as const
      };
    }
    
    return {
      text: 'Restricted Access',
      variant: 'secondary' as const
    };
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    
    // Try to cut at a word boundary
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    // If we found a space and it's not too far back, cut there
    if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    // Otherwise just cut at the character limit
    return truncated + '...';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.uploadedByName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string, expirationDate?: string) => {
    if (status === 'expired') {
      return <Badge className="status-overdue">Expired</Badge>;
    }
    if (status === 'expiring-soon') {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Expiring Soon</Badge>;
    }
    if (expirationDate) {
      return <Badge className="status-completed">Active</Badge>;
    }
    return <Badge className="status-pending">No Expiration</Badge>;
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

  const getFileIcon = (type: string) => {
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc._id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const getExpirationStatus = (expirationDate?: string) => {
    if (!expirationDate) return 'no-expiration';
    
    const expDate = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 30) return 'expiring-soon';
    return 'active';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Document Management</h1>
          <p className="text-muted-foreground">
            Store and manage compliance documents for your organization
          </p>
        </div>
        <Button 
          onClick={() => {
            setSelectedDocument(null);
            setIsDocumentModalOpen(true);
          }}
          className="btn-primary"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-semibold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-semibold text-success">
                  {documents.filter(d => getExpirationStatus(d.expirationDate) === 'active' || !d.expirationDate).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-semibold text-warning">
                  {documents.filter(d => getExpirationStatus(d.expirationDate) === 'expiring-soon').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-semibold text-destructive">
                  {documents.filter(d => getExpirationStatus(d.expirationDate) === 'expired').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Click on a document to view details or download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by uploading your first compliance document'}
              </p>
              <Button onClick={() => setIsDocumentModalOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Document</TableHead>
                    <TableHead className="hidden md:table-cell w-[100px]">Category</TableHead>
                    <TableHead className="w-[120px]">Access</TableHead>
                    <TableHead className="hidden lg:table-cell w-[120px]">Uploaded By</TableHead>
                    <TableHead className="hidden xl:table-cell w-[100px]">Upload Date</TableHead>
                    <TableHead className="hidden lg:table-cell w-[100px]">Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow 
                      key={doc._id} 
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.type)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium" title={doc.name}>
                              <span className="sm:hidden">{truncateText(doc.name, 20)}</span>
                              <span className="hidden sm:inline md:hidden">{truncateText(doc.name, 30)}</span>
                              <span className="hidden md:inline lg:hidden">{truncateText(doc.name, 40)}</span>
                              <span className="hidden lg:inline xl:hidden">{truncateText(doc.name, 50)}</span>
                              <span className="hidden xl:inline">{truncateText(doc.name, 60)}</span>
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{doc.type}</span>
                              <span className="md:hidden">•</span>
                              <span className="md:hidden">{truncateText(getCategoryLabel(doc.category), 10)}</span>
                              <span className="lg:hidden">•</span>
                              <span className="lg:hidden">{truncateText(doc.uploadedByName, 12)}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(doc.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={getAccessBadge(doc).variant} className="text-xs">
                            {getAccessBadge(doc).text}
                          </Badge>
                          {doc.visibility === 'restricted' && doc.assignedTo && doc.assignedTo.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {doc.assignedTo.length} users
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm">{doc.uploadedByName}</span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm">
                          <p>{format(new Date(doc.uploadDate), 'MMM dd, yyyy')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1">
                          {getStatusBadge(getExpirationStatus(doc.expirationDate), doc.expirationDate)}
                          {doc.expirationDate && (
                            <div className="text-xs text-muted-foreground">
                              Exp: {format(new Date(doc.expirationDate), 'MMM dd')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownload(doc)}
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsDocumentModalOpen(true);
                            }}
                            title="Edit document"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Modal */}
      <DocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onSave={() => {
          fetchDocuments();
          setIsDocumentModalOpen(false);
          setSelectedDocument(null);
        }}
      />
    </div>
  );
}
