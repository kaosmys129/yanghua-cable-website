<?php
// Load WordPress environment
require_once('wp-load.php');

if ( ! function_exists('acf_add_local_field_group') ) {
    echo "Error: Advanced Custom Fields Pro plugin is not active.";
    return;
}

// --- 1. Find and Delete Old Field Group ---
$args = array(
    'post_type' => 'acf-field-group',
    'posts_per_page' => -1,
);
$field_groups = get_posts($args);

if ($field_groups) {
    foreach ($field_groups as $field_group) {
        $location_rules = get_field('location', $field_group->ID);
        if (is_array($location_rules)) {
            foreach ($location_rules as $rule_group) {
                if (is_array($rule_group)) {
                    foreach ($rule_group as $rule) {
                        if (isset($rule['param']) && $rule['param'] == 'post_type' && isset($rule['operator']) && $rule['operator'] == '==' && isset($rule['value']) && $rule['value'] == 'project') {
                            // Found the group for 'project' post type, now delete it.
                            acf_delete_field_group($field_group->ID);
                            echo "Deleted existing field group: " . $field_group->post_title . "\n";
                        }
                    }
                }
            }
        }
    }
}


// --- 2. Define and Add New Field Group ---
acf_add_local_field_group(array(
    'key' => 'group_project_from_json',
    'title' => 'Project Fields (from JSON)',
    'fields' => array(
        array(
            'key' => 'field_project_title', 'label' => 'Title', 'name' => 'title', 'type' => 'text', 'required' => 1,
        ),
        array(
            'key' => 'field_project_short_description', 'label' => 'Description', 'name' => 'description', 'type' => 'textarea',
        ),
        array(
            'key' => 'field_project_content', 'label' => 'Content', 'name' => 'content', 'type' => 'wysiwyg',
        ),
        array(
            'key' => 'field_project_created_at', 'label' => 'Created At', 'name' => 'created_at', 'type' => 'date_picker',
        ),
        array(
            'key' => 'field_project_updated_at', 'label' => 'Updated At', 'name' => 'updated_at', 'type' => 'date_picker',
        ),
        array(
            'key' => 'field_project_tags', 'label' => 'Tags', 'name' => 'tags', 'type' => 'textarea', 'instructions' => 'Comma-separated values.',
        ),
        array(
            'key' => 'field_project_author', 'label' => 'Author', 'name' => 'author', 'type' => 'text',
        ),
        array(
            'key' => 'field_project_metadata',
            'label' => 'Metadata',
            'name' => 'metadata',
            'type' => 'group',
            'layout' => 'block',
            'sub_fields' => array(
                array('key' => 'field_meta_client', 'label' => 'Client', 'name' => 'client', 'type' => 'text'),
                array('key' => 'field_meta_industry', 'label' => 'Industry', 'name' => 'industry', 'type' => 'text'),
                array('key' => 'field_meta_location', 'label' => 'Location', 'name' => 'location', 'type' => 'text'),
                array('key' => 'field_meta_duration', 'label' => 'Duration', 'name' => 'duration', 'type' => 'text'),
                array('key' => 'field_meta_completion_date', 'label' => 'Completion Date', 'name' => 'completion_date', 'type' => 'date_picker'),
                array('key' => 'field_meta_project_scale', 'label' => 'Project Scale', 'name' => 'project_scale', 'type' => 'text'),
                array('key' => 'field_meta_power_efficiency', 'label' => 'Power Efficiency', 'name' => 'power_efficiency', 'type' => 'text'),
                array('key' => 'field_meta_space_savings', 'label' => 'Space Savings', 'name' => 'space_savings', 'type' => 'text'),
                array('key' => 'field_meta_installation_speed', 'label' => 'Installation Speed', 'name' => 'installation_speed', 'type' => 'text'),
                array('key' => 'field_meta_maintenance_reduction', 'label' => 'Maintenance Reduction', 'name' => 'maintenance_reduction', 'type' => 'text'),
                array('key' => 'field_meta_products_used', 'label' => 'Products Used', 'name' => 'products_used', 'type' => 'textarea', 'instructions' => 'Comma-separated values.'),
                array('key' => 'field_meta_testimonial', 'label' => 'Testimonial', 'name' => 'testimonial', 'type' => 'textarea'),
                array('key' => 'field_meta_testimonial_author', 'label' => 'Testimonial Author', 'name' => 'testimonial_author', 'type' => 'text'),
                array('key' => 'field_meta_testimonial_position', 'label' => 'Testimonial Position', 'name' => 'testimonial_position', 'type' => 'text'),
                array('key' => 'field_meta_production_efficiency', 'label' => 'Production Efficiency', 'name' => 'production_efficiency', 'type' => 'text'),
                array('key' => 'field_meta_safety_incidents', 'label' => 'Safety Incidents', 'name' => 'safety_incidents', 'type' => 'text'),
                array('key' => 'field_meta_energy_savings', 'label' => 'Energy Savings', 'name' => 'energy_savings', 'type' => 'text'),
                array('key' => 'field_meta_downtime_reduction', 'label' => 'Downtime Reduction', 'name' => 'downtime_reduction', 'type' => 'text'),
                array('key' => 'field_meta_system_reliability', 'label' => 'System Reliability', 'name' => 'system_reliability', 'type' => 'text'),
                array('key' => 'field_meta_response_time', 'label' => 'Response Time', 'name' => 'response_time', 'type' => 'text'),
                array('key' => 'field_meta_energy_density', 'label' => 'Energy Density', 'name' => 'energy_density', 'type' => 'text'),
                array('key' => 'field_meta_operational_cost_reduction', 'label' => 'Operational Cost Reduction', 'name' => 'operational_cost_reduction', 'type' => 'text'),
                array('key' => 'field_meta_downtime_minimization', 'label' => 'Downtime Minimization', 'name' => 'downtime_minimization', 'type' => 'text'),
                array('key' => 'field_meta_power_quality', 'label' => 'Power Quality', 'name' => 'power_quality', 'type' => 'text'),
                array('key' => 'field_meta_future_expansion_ready', 'label' => 'Future Expansion Ready', 'name' => 'future_expansion_ready', 'type' => 'text'),
                array('key' => 'field_meta_roi_achievement', 'label' => 'ROI Achievement', 'name' => 'roi_achievement', 'type' => 'text'),
                array('key' => 'field_meta_space_efficiency', 'label' => 'Space Efficiency', 'name' => 'space_efficiency', 'type' => 'text'),
                array('key' => 'field_meta_safety_compliance', 'label' => 'Safety Compliance', 'name' => 'safety_compliance', 'type' => 'text'),
                array('key' => 'field_meta_installation_time', 'label' => 'Installation Time', 'name' => 'installation_time', 'type' => 'text'),
                array('key' => 'field_meta_power_capacity', 'label' => 'Power Capacity', 'name' => 'power_capacity', 'type' => 'text'),
                array('key' => 'field_meta_environmental_resistance', 'label' => 'Environmental Resistance', 'name' => 'environmental_resistance', 'type' => 'text'),
                array('key' => 'field_meta_production_uptime', 'label' => 'Production Uptime', 'name' => 'production_uptime', 'type' => 'text'),
                array('key' => 'field_meta_maintenance_interval', 'label' => 'Maintenance Interval', 'name' => 'maintenance_interval', 'type' => 'text'),
                array('key' => 'field_meta_power_loss_reduction', 'label' => 'Power Loss Reduction', 'name' => 'power_loss_reduction', 'type' => 'text'),
                array('key' => 'field_meta_installation_time_reduction', 'label' => 'Installation Time Reduction', 'name' => 'installation_time_reduction', 'type' => 'text'),
                array('key' => 'field_meta_system_efficiency_improvement', 'label' => 'System Efficiency Improvement', 'name' => 'system_efficiency_improvement', 'type' => 'text'),
                array('key' => 'field_meta_maintenance_cost_reduction', 'label' => 'Maintenance Cost Reduction', 'name' => 'maintenance_cost_reduction', 'type' => 'text'),
            )
        ),
    ),
    'location' => array(
        array(
            array(
                'param' => 'post_type',
                'operator' => '==',
                'value' => 'project',
            ),
        ),
    ),
    'active' => true,
));

echo "Successfully created new ACF field group for 'Project' post type based on JSON structure.";