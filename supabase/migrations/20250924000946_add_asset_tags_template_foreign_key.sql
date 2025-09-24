-- Add foreign key constraint for asset_tags.printed_template -> asset_tag_templates.id
alter table "public"."asset_tags" 
add constraint "asset_tags_printed_template_fkey" 
FOREIGN KEY (printed_template) REFERENCES asset_tag_templates(id) 
ON UPDATE CASCADE ON DELETE SET NULL;
