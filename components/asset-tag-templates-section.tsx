"use client";

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AssetTagTemplatePreview } from '@/components/asset-tag-templates/template-preview';
import Link from 'next/link';
import { AssetTagTemplate } from '@/components/asset-tag-templates/types';
import { MoreHorizontal, Plus, Eye, Edit, Trash2 } from 'lucide-react';

type AssetTagTemplateFromDB = {
  id: number;
  created_at: string;
  template: AssetTagTemplate | null;
};

export function AssetTagTemplatesSection() {
  const [templates, setTemplates] = useState<AssetTagTemplateFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<AssetTagTemplate | null>(null);
  const supabase = createClient();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's company
      const { data: userCompany, error: companyError } = await supabase
        .from('users_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
console.log(companyError, userCompany, user.id);
      if (companyError || !userCompany) {
        console.log(companyError, userCompany, user.id);
        throw new Error('No company found for user');
      }

      // Load templates
      const { data, error: templatesError } = await supabase
        .from('asset_tag_templates')
        .select('id, created_at, template')
        .eq('company_id', userCompany.company_id)
        .order('created_at', { ascending: false });

      if (templatesError) {
        throw templatesError;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('asset_tag_templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      await loadTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      alert('Failed to delete template');
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Tag Templates</CardTitle>
          <CardDescription>Loading templates...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Asset Tag Templates</CardTitle>
            <CardDescription>
              Manage templates for generating asset tags
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/management/asset-tag-templates/new" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {templates.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>No templates created yet.</p>
            <p className="text-sm">Create your first template to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">
                        {template.template?.name || 'Unnamed Template'}
                      </h3>
                      <Badge variant="secondary">
                        ID: {template.id}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <strong>Size:</strong> {template.template ? 
                          `${template.template.tagWidthMm}×${template.template.tagHeightMm}mm` : 
                          '—'
                        }
                      </div>
                      <div>
                        <strong>Elements:</strong> {template.template?.elements?.length || 0} elements
                        {template.template?.elements && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {template.template.elements.map((element, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {element.type} ({element.x},{element.y})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(template.created_at).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {template.template && (
                        <DropdownMenuItem onSelect={() => setPreviewTemplate(template.template)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/management/asset-tag-templates/${template.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {previewTemplate && (
          <Dialog open onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{previewTemplate.name || 'Template Preview'}</DialogTitle>
              </DialogHeader>
              <AssetTagTemplatePreview template={previewTemplate} />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}