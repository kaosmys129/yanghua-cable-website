<?php
// Load the WordPress environment
require_once('wp-load.php');

echo "--- Starting Project Import Script (Flattened Structure) ---\n";

// --- 1. Configuration ---
$json_file_path = '/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/public/data/projects_complete_content copy.json';
$post_type = 'project';

// --- 2. File and JSON Validation ---
if (!file_exists($json_file_path) || !is_readable($json_file_path)) {
    echo "ERROR: JSON file not found or is not readable at: {$json_file_path}\n";
    exit;
}

$content = file_get_contents($json_file_path);
$data = json_decode($content, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo "ERROR: Invalid JSON format. " . json_last_error_msg() . "\n";
    exit;
}

if (!isset($data['projects']) || !is_array($data['projects'])) {
    echo "ERROR: JSON structure is incorrect. Missing 'projects' array.\n";
    exit;
}

// --- 3. Import Process ---
$projects = $data['projects'];
$imported_count = 0;
$skipped_count = 0;

foreach ($projects as $index => $project_data) {
    $project_title = $project_data['title'] ?? 'Untitled Project ' . ($index + 1);

    // Check if a project with the same title already exists to avoid duplicates
    $existing_post = get_page_by_title($project_title, OBJECT, $post_type);

    if ($existing_post) {
        echo "Skipping: Project '{$project_title}' already exists (Post ID: {$existing_post->ID}).\n";
        $skipped_count++;
        continue;
    }

    echo "Importing: '{$project_title}'...\n";

    // Create the new post
    $post_args = [
        'post_title'   => $project_title,
        'post_content' => $project_data['content'] ?? '',
        'post_status'  => 'publish',
        'post_type'    => $post_type,
    ];

    $post_id = wp_insert_post($post_args);

    if (is_wp_error($post_id)) {
        echo "  ERROR: Failed to create post for '{$project_title}'. " . $post_id->get_error_message() . "\n";
        continue;
    }

    // --- 4. Update ACF Fields (Flattened) ---
    // Map data to the flattened ACF fields.

    update_field('title', $project_title, $post_id);
    update_field('content', $project_data['content'] ?? '', $post_id);
    update_field('client', $project_data['client'] ?? '', $post_id);
    update_field('industry', $project_data['industry'] ?? '', $post_id);
    update_field('location', $project_data['location'] ?? '', $post_id);
    update_field('completion_date', $project_data['completion_date'] ?? '', $post_id);
    update_field('duration', $project_data['duration'] ?? '', $post_id);
    update_field('project_scale', $project_data['project_scale'] ?? '', $post_id);
    update_field('testimonial', $project_data['testimonial'] ?? '', $post_id);
    update_field('testimonial_author', $project_data['testimonial_author'] ?? '', $post_id);
    update_field('testimonial_position', $project_data['testimonial_position'] ?? '', $post_id);

    // Handle repeater fields: tags and products_used
    if (!empty($project_data['tags']) && is_array($project_data['tags'])) {
        $tags_rows = [];
        foreach ($project_data['tags'] as $tag) {
            $tags_rows[] = ['tag' => $tag];
        }
        update_field('tags', $tags_rows, $post_id);
    }

    if (!empty($project_data['products_used']) && is_array($project_data['products_used'])) {
        $products_rows = [];
        foreach ($project_data['products_used'] as $product) {
            $products_rows[] = ['product_item' => $product];
        }
        update_field('products_used', $products_rows, $post_id);
    }
    
    echo "  SUCCESS: Created post with ID: {$post_id}\n";
    $imported_count++;
}

// --- 5. Final Report ---
echo "\n--- Import Complete ---\n";
echo "Successfully imported: {$imported_count} projects.\n";
echo "Skipped (already exist): {$skipped_count} projects.\n";
echo "Total projects in JSON: " . count($projects) . "\n";

?>