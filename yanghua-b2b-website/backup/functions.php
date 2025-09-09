<?php
/**
 * Twenty Twenty-Five functions and definitions.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package WordPress
 * @subpackage Twenty_Twenty_Five
 * @since Twenty Twenty-Five 1.0
 */

// Adds theme support for post formats.
if ( ! function_exists( 'twentytwentyfive_post_format_setup' ) ) :
	/**
	 * Adds theme support for post formats.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function twentytwentyfive_post_format_setup() {
		add_theme_support( 'post-formats', array( 'aside', 'audio', 'chat', 'gallery', 'image', 'link', 'quote', 'status', 'video' ) );
	}
endif;
add_action( 'after_setup_theme', 'twentytwentyfive_post_format_setup' );

// Enqueues editor-style.css in the editors.
if ( ! function_exists( 'twentytwentyfive_editor_style' ) ) :
	/**
	 * Enqueues editor-style.css in the editors.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function twentytwentyfive_editor_style() {
		add_editor_style( 'assets/css/editor-style.css' );
	}
endif;
add_action( 'after_setup_theme', 'twentytwentyfive_editor_style' );

// Enqueues style.css on the front.
if ( ! function_exists( 'twentytwentyfive_enqueue_styles' ) ) :
	/**
	 * Enqueues style.css on the front.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function twentytwentyfive_enqueue_styles() {
		wp_enqueue_style(
			'twentytwentyfive-style',
			get_parent_theme_file_uri( 'style.css' ),
			array(),
			wp_get_theme()->get( 'Version' )
		);
	}
endif;
add_action( 'wp_enqueue_scripts', 'twentytwentyfive_enqueue_styles' );

// Registers custom block styles.
if ( ! function_exists( 'twentytwentyfive_block_styles' ) ) :
	/**
	 * Registers custom block styles.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function twentytwentyfive_block_styles() {
		register_block_style(
			'core/list',
			array(
				'name'         => 'checkmark-list',
				'label'        => __( 'Checkmark', 'twentytwentyfive' ),
				'inline_style' => '
				ul.is-style-checkmark-list {
					list-style-type: "\2713";
				}

				ul.is-style-checkmark-list li {
					padding-inline-start: 1ch;
				}',
			)
		);
	}
endif;
add_action( 'init', 'twentytwentyfive_block_styles' );

// Registers pattern categories.
if ( ! function_exists( 'twentytwentyfive_pattern_categories' ) ) :
	/**
	 * Registers pattern categories.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function twentytwentyfive_pattern_categories() {

		register_block_pattern_category(
			'twentytwentyfive_page',
			array(
				'label'       => __( 'Pages', 'twentytwentyfive' ),
				'description' => __( 'A collection of full page layouts.', 'twentytwentyfive' ),
			)
		);

		register_block_pattern_category(
			'twentytwentyfive_post-format',
			array(
				'label'       => __( 'Post formats', 'twentytwentyfive' ),
				'description' => __( 'A collection of post format patterns.', 'twentytwentyfive' ),
			)
		);
	}
endif;
add_action( 'init', 'twentytwentyfive_pattern_categories' );

// Registers block binding sources.
if ( ! function_exists( 'twentytwentyfive_register_block_bindings' ) ) :
	/**
	 * Registers the post format block binding source.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return void
	 */
	function twentytwentyfive_register_block_bindings() {
		register_block_bindings_source(
			'twentytwentyfive/format',
			array(
				'label'              => _x( 'Post format name', 'Label for the block binding placeholder in the editor', 'twentytwentyfive' ),
				'get_value_callback' => 'twentytwentyfive_format_binding',
			)
		);
	}
endif;
add_action( 'init', 'twentytwentyfive_register_block_bindings' );

// Registers block binding callback function for the post format name.
if ( ! function_exists( 'twentytwentyfive_format_binding' ) ) :
	/**
	 * Callback function for the post format name block binding source.
	 *
	 * @since Twenty Twenty-Five 1.0
	 *
	 * @return string|void Post format name, or nothing if the format is 'standard'.
	 */
	function twentytwentyfive_format_binding() {
		$post_format_slug = get_post_format();

		if ( $post_format_slug && 'standard' !== $post_format_slug ) {
			return get_post_format_string( $post_format_slug );
		}
	}
endif;


/**
 * WordPress 项目中心完整配置 - ACF免费版优化
 * 修复文件编码并适配ACF免费版功能限制
 */

// ========================================
// 1. 创建自定义文章类型 - 项目中心
// ========================================
function create_project_post_type() {
    $labels = array(
        'name'               => '项目中心',
        'singular_name'      => '项目',
        'menu_name'          => '项目中心',
        'add_new'            => '添加项目',
        'add_new_item'       => '添加新项目',
        'edit_item'          => '编辑项目',
        'new_item'           => '新项目',
        'view_item'          => '查看项目',
        'search_items'       => '搜索项目',
        'not_found'          => '未找到项目',
        'not_found_in_trash' => '回收站中未找到项目'
    );

    $args = array(
        'labels'              => $labels,
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'query_var'           => true,
        'rewrite'             => array('slug' => 'projects'),
        'capability_type'     => 'post',
        'has_archive'         => true,
        'hierarchical'        => false,
        'menu_position'       => 6,
        'menu_icon'           => 'dashicons-portfolio',
        'supports'            => array('title', 'editor', 'thumbnail', 'excerpt'),
        'show_in_rest'        => true,
    );

    register_post_type('project', $args);
}
add_action('init', 'create_project_post_type');

// ========================================
// 2. 创建项目分类法
// ========================================
function create_project_taxonomies() {
    // 项目行业分类
    register_taxonomy('project_industry', 'project', array(
        'labels' => array(
            'name' => '项目行业',
            'singular_name' => '行业',
        ),
        'hierarchical' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'industry'),
        'show_in_rest' => true,
    ));

    // 项目标签
    register_taxonomy('project_tag', 'project', array(
        'labels' => array(
            'name' => '项目标签',
            'singular_name' => '标签',
        ),
        'hierarchical' => false,
        'show_ui' => true,
        'show_admin_column' => true,
        'query_var' => true,
        'rewrite' => array('slug' => 'project-tag'),
        'show_in_rest' => true,
    ));
}
add_action('init', 'create_project_taxonomies');

// ========================================
// 3. 添加管理菜单 - 项目导入功能
// ========================================
function add_project_import_menu() {
    add_submenu_page(
        'edit.php?post_type=project',
        '导入项目数据',
        '导入数据',
        'manage_options',
        'import-projects',
        'project_import_page'
    );
}
add_action('admin_menu', 'add_project_import_menu');

// ========================================
// 4. 项目导入页面
// ========================================
function project_import_page() {
    ?>
    <div class="wrap">
        <h1>导入项目数据</h1>
        
        <?php if (isset($_POST['import_projects'])): ?>
            <?php
            // 处理导入
            $result = import_projects_from_json();
            if ($result['success']) {
                echo '<div class="notice notice-success"><p>成功导入 ' . $result['count'] . ' 个项目！</p></div>';
            } else {
                echo '<div class="notice notice-error"><p>导入失败：' . $result['message'] . '</p></div>';
            }
            ?>
        <?php endif; ?>

        <div class="card">
            <h2>从JSON文件导入项目</h2>
            <form method="post" enctype="multipart/form-data">
                <table class="form-table">
                    <tr>
                        <th scope="row">JSON文件</th>
                        <td>
                            <input type="file" name="json_file" accept=".json" />
                            <p class="description">上传包含项目数据的JSON文件</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">导入选项</th>
                        <td>
                            <label>
                                <input type="checkbox" name="update_existing" value="1" />
                                更新已存在的项目（基于标题匹配）
                            </label>
                            <br>
                            <label>
                                <input type="checkbox" name="import_featured" value="1" checked />
                                将前3个项目标记为精选项目
                            </label>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('开始导入', 'primary', 'import_projects'); ?>
            </form>
        </div>

        <div class="card">
            <h2>快速导入预设数据</h2>
            <p>点击下方按钮导入预设的项目数据（华为、比亚迪、CATL等项目）</p>
            <form method="post">
                <?php submit_button('导入预设项目数据', 'secondary', 'import_preset_projects'); ?>
            </form>
        </div>

        <div class="card">
            <h2>ACF免费版说明</h2>
            <p><strong>注意：</strong>此配置已优化适配ACF免费版，主要特点：</p>
            <ul>
                <li>✅ 使用扁平化字段结构（无字段组前缀）</li>
                <li>✅ 固定性能指标字段替代重复字段</li>
                <li>✅ Textarea存储产品列表</li>
                <li>✅ 4个独立图片字段替代图片库</li>
                <li>✅ Tab分组改善用户体验</li>
            </ul>
        </div>
    </div>

    <?php if (isset($_POST['import_preset_projects'])): ?>
        <?php
        $result = import_preset_projects();
        if ($result['success']) {
            echo '<div class="notice notice-success"><p>成功导入 ' . $result['count'] . ' 个预设项目！</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>导入失败：' . $result['message'] . '</p></div>';
        }
        ?>
    <?php endif; ?>
    <?php
}

// ========================================
// 5. JSON数据导入核心函数
// ========================================
function import_projects_from_json() {
    if (!isset($_FILES['json_file']) || $_FILES['json_file']['error'] !== UPLOAD_ERR_OK) {
        return array('success' => false, 'message' => '请选择有效的JSON文件');
    }

    $json_content = file_get_contents($_FILES['json_file']['tmp_name']);
    $data = json_decode($json_content, true);

    if (!$data || !isset($data['projects'])) {
        return array('success' => false, 'message' => 'JSON格式无效或缺少projects数组');
    }

    $update_existing = isset($_POST['update_existing']) && $_POST['update_existing'];
    $import_featured = isset($_POST['import_featured']) && $_POST['import_featured'];
    $imported_count = 0;

    foreach ($data['projects'] as $index => $project_data) {
        $result = create_project_from_data($project_data, $update_existing, $import_featured && $index < 3);
        if ($result) {
            $imported_count++;
        }
    }

    return array('success' => true, 'count' => $imported_count);
}

// ========================================
// 6. 预设数据导入函数
// ========================================
function import_preset_projects() {
    $preset_data = get_preset_project_data();
    $imported_count = 0;

    foreach ($preset_data['projects'] as $index => $project_data) {
        $result = create_project_from_data($project_data, true, $index < 3);
        if ($result) {
            $imported_count++;
        }
    }

    return array('success' => true, 'count' => $imported_count);
}

// ========================================
// 7. 创建项目的核心函数
// ========================================
function create_project_from_data($project_data, $update_existing = false, $featured = false) {
    // 检查是否已存在同名项目
    $existing_post = get_page_by_title($project_data['title'], OBJECT, 'project');
    
    if ($existing_post && !$update_existing) {
        return false; // 跳过已存在的项目
    }

    // 准备文章数据
    $post_data = array(
        'post_title'    => $project_data['title'],
        'post_content'  => $project_data['content'],
        'post_excerpt'  => $project_data['description'],
        'post_status'   => 'publish',
        'post_type'     => 'project',
        'post_author'   => 1,
        'post_date'     => date('Y-m-d H:i:s', strtotime($project_data['created_at']))
    );

    if ($existing_post) {
        $post_data['ID'] = $existing_post->ID;
        $post_id = wp_update_post($post_data);
    } else {
        $post_id = wp_insert_post($post_data);
    }

    if (is_wp_error($post_id)) {
        return false;
    }

    // 更新ACF字段（免费版）
    update_project_acf_fields_free($post_id, $project_data, $featured);

    // 设置分类和标签
    set_project_taxonomies($post_id, $project_data);

    return $post_id;
}

// ========================================
// 8. 更新ACF字段 - 适配免费版（核心修改）
// ========================================
function update_project_acf_fields_free($post_id, $project_data, $featured = false) {
    $metadata = $project_data['metadata'];

    // 基本字段（直接使用字段名，无字段组前缀）
    update_field('project_title', $project_data['title'], $post_id);
    update_field('project_description', $project_data['description'], $post_id);
    update_field('project_content', $project_data['content'], $post_id);
    update_field('project_author', $project_data['author'], $post_id);

    // 日期字段（扁平化结构）
    update_field('created_at', $project_data['created_at'], $post_id);
    update_field('updated_at', $project_data['updated_at'], $post_id);

    // 项目元数据（扁平化字段）
    update_field('client', $metadata['client'], $post_id);
    update_field('industry', $metadata['industry'], $post_id);
    update_field('location', $metadata['location'], $post_id);
    update_field('duration', $metadata['duration'], $post_id);
    update_field('completion_date', $metadata['completion_date'], $post_id);
    update_field('project_scale', $metadata['project_scale'], $post_id);

    // 固定的性能指标字段（替代重复字段）
    $performance_fields_mapping = array(
        'power_efficiency' => 'power_efficiency',
        'space_savings' => 'space_savings',
        'installation_speed' => 'installation_speed',
        'maintenance_reduction' => 'maintenance_reduction',
        'system_reliability' => 'system_reliability',
        'response_time' => 'response_time',
        'energy_savings' => 'energy_savings',
        'production_efficiency' => 'production_efficiency'
    );

    // 更新固定性能指标
    foreach ($performance_fields_mapping as $json_key => $acf_key) {
        if (isset($metadata[$json_key])) {
            update_field($acf_key, $metadata[$json_key], $post_id);
        }
    }

    // 其他性能指标存储到custom_metrics字段
    $custom_metrics = array();
    $exclude_keys = array_merge(
        array_keys($performance_fields_mapping),
        array('client', 'industry', 'location', 'duration', 'completion_date', 'project_scale', 'products_used', 'testimonial', 'testimonial_author', 'testimonial_position')
    );

    foreach ($metadata as $key => $value) {
        if (!in_array($key, $exclude_keys)) {
            $custom_metrics[] = ucfirst(str_replace('_', ' ', $key)) . ': ' . $value;
        }
    }

    if (!empty($custom_metrics)) {
        update_field('custom_metrics', implode("\n", $custom_metrics), $post_id);
    }

    // 使用产品 - 存储为换行分隔的文本（替代重复字段）
    if (isset($metadata['products_used']) && is_array($metadata['products_used'])) {
        update_field('products_used', implode("\n", $metadata['products_used']), $post_id);
    }

    // 客户推荐 - 独立字段（扁平化）
    if (isset($metadata['testimonial'])) {
        update_field('testimonial_content', $metadata['testimonial'], $post_id);
        update_field('testimonial_author', $metadata['testimonial_author'] ?? '', $post_id);
        update_field('testimonial_position', $metadata['testimonial_position'] ?? '', $post_id);
    }

    // 项目状态和精选标记
    update_field('project_status', 'completed', $post_id);
    update_field('featured_project', $featured, $post_id);
}

// ========================================
// 9. 设置项目分类和标签
// ========================================
function set_project_taxonomies($post_id, $project_data) {
    $metadata = $project_data['metadata'];

    // 设置行业分类
    if (isset($metadata['industry'])) {
        $industry_term = wp_insert_term($metadata['industry'], 'project_industry');
        if (!is_wp_error($industry_term)) {
            wp_set_post_terms($post_id, array($industry_term['term_id']), 'project_industry');
        } else {
            // 如果分类已存在，获取已存在的分类
            $existing_term = get_term_by('name', $metadata['industry'], 'project_industry');
            if ($existing_term) {
                wp_set_post_terms($post_id, array($existing_term->term_id), 'project_industry');
            }
        }
    }

    // 设置项目标签
    if (isset($project_data['tags']) && is_array($project_data['tags'])) {
        $tag_ids = array();
        foreach ($project_data['tags'] as $tag) {
            $tag_term = wp_insert_term($tag, 'project_tag');
            if (!is_wp_error($tag_term)) {
                $tag_ids[] = $tag_term['term_id'];
            } else {
                // 如果标签已存在，获取已存在的标签
                $existing_tag = get_term_by('name', $tag, 'project_tag');
                if ($existing_tag) {
                    $tag_ids[] = $existing_tag->term_id;
                }
            }
        }
        if (!empty($tag_ids)) {
            wp_set_post_terms($post_id, $tag_ids, 'project_tag');
        }
    }
}

// ========================================
// 10. 预设项目数据
// ========================================
function get_preset_project_data() {
    return array(
        "projects" => array(
            array(
                "title" => "Huawei Data Center Expansion",
                "description" => "High-density power distribution for cloud infrastructure expansion",
                "content" => "This project involved the expansion of Huawei's data center infrastructure, requiring a reliable and scalable power distribution system. The 2000A flexible busbar system was implemented to provide high-density power distribution for expanding cloud infrastructure. The modular design allows for easy expansion and maintenance while maintaining high reliability. The solution significantly improved power distribution efficiency and reliability, achieving 95% power efficiency and 40% space savings.",
                "created_at" => "2024-06-01",
                "updated_at" => "2024-06-01",
                "tags" => array("Data Center", "Cloud Infrastructure", "High-Density Power", "Scalable Solutions"),
                "author" => "Yanghua STI Engineering Team",
                "metadata" => array(
                    "client" => "Huawei Technologies",
                    "industry" => "Data Center",
                    "location" => "Shenzhen, China",
                    "duration" => "4 months",
                    "completion_date" => "June 2024",
                    "project_scale" => "2000A system",
                    "power_efficiency" => "95%",
                    "space_savings" => "40%",
                    "installation_speed" => "50% faster",
                    "maintenance_reduction" => "30%",
                    "products_used" => array("2000A Flexible Busbar", "High-density connectors", "Smart monitoring system", "Fire-resistant insulation"),
                    "testimonial" => "The flexible busbar solution significantly improved our data center power distribution efficiency and reliability.",
                    "testimonial_author" => "Li Wei",
                    "testimonial_position" => "Data Center Manager"
                )
            ),
            array(
                "title" => "BYD Battery Manufacturing",
                "description" => "Flexible power solution for lithium battery production lines",
                "content" => "This project provided a comprehensive power solution for BYD's lithium battery manufacturing facility. The 1600A flexible busbar system was designed to handle complex power requirements for battery production lines with varying loads and strict safety standards. The system features dynamic load balancing and enhanced safety features for critical manufacturing processes. The implementation resulted in a 25% increase in production efficiency with zero safety incidents.",
                "created_at" => "2024-04-01",
                "updated_at" => "2024-04-01",
                "tags" => array("New Energy", "Battery Manufacturing", "Lithium Battery", "Safety Systems"),
                "author" => "Yanghua STI Engineering Team",
                "metadata" => array(
                    "client" => "BYD Company",
                    "industry" => "New Energy",
                    "location" => "Shenzhen, China",
                    "duration" => "5 months",
                    "completion_date" => "April 2024",
                    "project_scale" => "1600A system",
                    "production_efficiency" => "25% increase",
                    "safety_incidents" => "Zero",
                    "energy_savings" => "15%",
                    "downtime_reduction" => "60%",
                    "products_used" => array("1600A Flexible Busbar", "Safety interlocks", "Load monitoring", "Emergency shutdown systems"),
                    "testimonial" => "Professional solution that met all our stringent requirements for battery manufacturing.",
                    "testimonial_author" => "Wang Ming",
                    "testimonial_position" => "Production Director"
                )
            ),
            array(
                "title" => "CATL Energy Storage",
                "description" => "High-current busbar system for battery energy storage facility",
                "content" => "This project involved the implementation of a high-capacity power distribution system for CATL's battery energy storage facility. The 2500A high-current flexible busbar system was designed with redundant architecture and advanced monitoring capabilities to meet demanding reliability standards. The system achieved 99.9% system reliability with response times under 10ms, significantly improving energy density by 30% and reducing operational costs by 20%.",
                "created_at" => "2023-12-01",
                "updated_at" => "2023-12-01",
                "tags" => array("New Energy", "Energy Storage", "Battery Storage", "High-Reliability"),
                "author" => "Yanghua STI Engineering Team",
                "metadata" => array(
                    "client" => "CATL",
                    "industry" => "New Energy",
                    "location" => "Ningde, China",
                    "duration" => "6 months",
                    "completion_date" => "December 2023",
                    "project_scale" => "2500A system",
                    "system_reliability" => "99.9%",
                    "response_time" => "<10ms",
                    "energy_density" => "30% improvement",
                    "operational_cost_reduction" => "20%",
                    "products_used" => array("2500A Flexible Busbar", "Redundant power paths", "Real-time monitoring", "Thermal management"),
                    "testimonial" => "Exceptional performance in our energy storage applications with outstanding reliability.",
                    "testimonial_author" => "Chen Hua",
                    "testimonial_position" => "Technical Director"
                )
            ),
            array(
                "title" => "Midea Industrial Complex",
                "description" => "Modern power distribution for manufacturing facility upgrade",
                "content" => "This project focused on the modernization of power distribution in Midea's existing manufacturing facility without disrupting production operations. The 1000A flexible busbar system was implemented using a phased installation approach to minimize downtime during the upgrade. The modular design achieved 80% reduction in downtime while significantly improving power quality and providing future expansion capabilities.",
                "created_at" => "2023-09-01",
                "updated_at" => "2023-09-01",
                "tags" => array("Industrial", "Manufacturing", "Facility Upgrade", "Minimal Downtime"),
                "author" => "Yanghua STI Engineering Team",
                "metadata" => array(
                    "client" => "Midea Group",
                    "industry" => "Industrial",
                    "location" => "Foshan, China",
                    "duration" => "3 months",
                    "completion_date" => "September 2023",
                    "project_scale" => "1000A system",
                    "downtime_minimization" => "80% reduction",
                    "power_quality" => "Significant improvement",
                    "future_expansion_ready" => "Modular design",
                    "roi_achievement" => "18 months",
                    "products_used" => array("1000A Flexible Busbar", "Modular connectors", "Power quality monitoring", "Retrofit solutions"),
                    "testimonial" => "Smooth upgrade process with minimal disruption to our production schedule.",
                    "testimonial_author" => "Liu Qiang",
                    "testimonial_position" => "Facility Manager"
                )
            ),
            array(
                "title" => "Metro Line 14",
                "description" => "Underground power distribution for new metro line",
                "content" => "This project provided underground power distribution for Shenzhen Metro's new Line 14. The 800A compact flexible busbar system was specifically designed for underground environments with enhanced safety features. The system achieved 50% space savings while meeting 100% safety compliance standards for public transportation applications.",
                "created_at" => "2023-06-01",
                "updated_at" => "2023-06-01",
                "tags" => array("Rail Transit", "Underground Metro", "Public Transportation", "Safety Compliance"),
                "author" => "Yanghua STI Engineering Team",
                "metadata" => array(
                    "client" => "Shenzhen Metro",
                    "industry" => "Rail Transit",
                    "location" => "Shenzhen, China",
                    "duration" => "8 months",
                    "completion_date" => "June 2023",
                    "project_scale" => "800A system",
                    "space_efficiency" => "50% space savings",
                    "safety_compliance" => "100% met",
                    "installation_time" => "40% faster",
                    "system_reliability" => "99.8%",
                    "products_used" => array("800A Flexible Busbar", "Underground-rated components", "Fire safety systems", "Vibration dampening"),
                    "testimonial" => "Reliable solution that met all our underground metro requirements.",
                    "testimonial_author" => "Zhang Lei",
                    "testimonial_position" => "Project Manager"
                )
            ),
            array(
                "title" => "Steel Mill Modernization",
                "description" => "Heavy-duty power solution for steel production modernization",
                "content" => "This project provided heavy-duty power distribution for Baosteel Group's steel production modernization. The 4000A heavy-duty flexible busbar system was designed for harsh industrial environments with IP65-rated protection and redundant design. The system achieved 99.5% production uptime with extended maintenance intervals twice the industry standard.",
                "created_at" => "2022-03-01",
                "updated_at" => "2022-03-01",
                "tags" => array("Metallurgy", "Steel Production", "Heavy-Duty", "Industrial Environment"),
                "author" => "Yanghua STI Engineering Team",
                "metadata" => array(
                    "client" => "Baosteel Group",
                    "industry" => "Metallurgy",
                    "location" => "Shanghai, China",
                    "duration" => "10 months",
                    "completion_date" => "March 2022",
                    "project_scale" => "4000A system",
                    "power_capacity" => "4000A continuous",
                    "environmental_resistance" => "IP65 rated",
                    "production_uptime" => "99.5%",
                    "maintenance_interval" => "Extended 2x",
                    "products_used" => array("4000A Heavy-duty Busbar", "Industrial enclosures", "Environmental protection", "Redundant systems"),
                    "testimonial" => "Robust solution that withstands our demanding steel production environment.",
                    "testimonial_author" => "Sun Jian",
                    "testimonial_position" => "Chief Engineer"
                )
            ),
            array(
                "title" => "50MW Solar Farm Power Distribution",
                "description" => "Efficient power transmission solution for large-scale solar farm",
                "content" => "This project provided power distribution for a 50MW solar farm in Ningxia, China. The 2000A high-current flexible busbar system replaced traditional cable solutions, addressing issues such as high voltage drop, complex installation, and difficult maintenance. The optimized layout design reduced connection points and improved system reliability, resulting in 35% power loss reduction and 60% installation time reduction.",
                "created_at" => "2024-03-01",
                "updated_at" => "2024-03-01",
                "tags" => array("New Energy", "Solar Farm", "Renewable Energy", "Power Transmission"),
                "author" => "Yanghua STI Engineering Team",
                "metadata" => array(
                    "client" => "Ningxia Solar Energy Co.",
                    "industry" => "New Energy",
                    "location" => "Ningxia, China",
                    "duration" => "6 months",
                    "completion_date" => "March 2024",
                    "project_scale" => "50MW Solar Farm, 2000A Flexible Busbar System",
                    "power_loss_reduction" => "35%",
                    "installation_time_reduction" => "60%",
                    "system_efficiency_improvement" => "8%",
                    "maintenance_cost_reduction" => "40%",
                    "products_used" => array("2000A Flexible Busbar", "Connection Terminals", "Insulation Accessories", "Monitoring System"),
                    "testimonial" => "Yanghua Tech's flexible busbar system not only solved our technical challenges but also greatly improved the overall project efficiency. The professional technical support team ensured smooth project progress.",
                    "testimonial_author" => "Engineer Zhang",
                    "testimonial_position" => "Project Technical Director"
                )
            )
        )
    );
}

// ========================================
// 11. 刷新重写规则
// ========================================
function flush_project_rewrite_rules() {
    create_project_post_type();
    create_project_taxonomies();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'flush_project_rewrite_rules');

// ========================================
// 12. 添加项目列表的自定义列（修正字段名称）
// ========================================
function add_project_admin_columns($columns) {
    $new_columns = array();
    $new_columns['cb'] = $columns['cb'];
    $new_columns['title'] = $columns['title'];
    $new_columns['client'] = '客户';
    $new_columns['industry'] = '行业';
    $new_columns['location'] = '地点';
    $new_columns['completion_date'] = '完成日期';
    $new_columns['featured'] = '精选';
    $new_columns['date'] = $columns['date'];
    
    return $new_columns;
}
add_filter('manage_project_posts_columns', 'add_project_admin_columns');

function populate_project_admin_columns($column, $post_id) {
    switch ($column) {
        case 'client':
            $client = get_post_meta($post_id, 'client', true);
            if (!empty($client)) {
                echo '<strong>' . esc_html($client) . '</strong>';
            } else {
                echo '<span style="color: #999;">-</span>';
            }
            break;

        case 'industry':
            $industry_text = get_post_meta($post_id, 'industry', true);
            if (!empty($industry_text)) {
                echo esc_html($industry_text);
            } else {
                echo '<span style="color: #999;">-</span>';
            }
            break;

        case 'location':
            $location = get_post_meta($post_id, 'location', true);
            if (!empty($location)) {
                echo '<span style="color: #2271b1;">' . esc_html($location) . '</span>';
            } else {
                echo '<span style="color: #999;">-</span>';
            }
            break;

        case 'completion_date':
            $date = get_post_meta($post_id, 'completion_date', true);
            if (!empty($date)) {
                $timestamp = strtotime($date);
                if ($timestamp > 0) {
                    $formatted_date = date_i18n(get_option('date_format'), $timestamp);
                    echo '<span style="color: #135e96;">' . esc_html($formatted_date) . '</span>';
                } else {
                     echo '<span style="color: #135e96;">' . esc_html($date) . '</span>';
                }
            } else {
                echo '<span style="color: #999;">-</span>';
            }
            break;

        case 'featured':
            $featured = get_post_meta($post_id, 'featured_project', true);
            if ($featured == '1') {
                echo '<span style="color: #d63638; font-weight: bold;">✓ 精选</span>';
            } else {
                echo '<span style="color: #999;">-</span>';
            }
            break;
    }
}
add_action('manage_project_posts_custom_column', 'populate_project_admin_columns', 10, 2);

// 添加项目列表列的样式
function add_project_admin_column_styles() {
    echo '<style>
        .wp-list-table.projects th.column-client,
        .wp-list-table.projects td.column-client {
            width: 15%;
        }
        .wp-list-table.projects th.column-industry,
        .wp-list-table.projects td.column-industry {
            width: 12%;
        }
        .wp-list-table.projects th.column-location,
        .wp-list-table.projects td.column-location {
            width: 12%;
        }
        .wp-list-table.projects th.column-completion_date,
        .wp-list-table.projects td.column-completion_date {
            width: 10%;
        }
        .wp-list-table.projects th.column-featured,
        .wp-list-table.projects td.column-featured {
            width: 8%;
            text-align: center;
        }
        .wp-list-table.projects td.column-client strong {
            color: #1d2327;
            font-weight: 600;
        }
        .wp-list-table.projects td.column-location {
            font-size: 13px;
        }
        .wp-list-table.projects td.column-completion_date {
            font-size: 13px;
            white-space: nowrap;
        }
    </style>';
}
add_action('admin_head-edit.php', 'add_project_admin_column_styles');

// 使项目列表列可排序
function make_project_columns_sortable($columns) {
    $columns['client'] = 'client';
    $columns['industry'] = 'industry';
    $columns['location'] = 'location';
    $columns['completion_date'] = 'completion_date';
    $columns['featured'] = 'featured_project';
    
    return $columns;
}
add_filter('manage_edit-project_sortable_columns', 'make_project_columns_sortable');

// 处理项目列表排序
function handle_project_column_sorting($query) {
    if (!is_admin() || !$query->is_main_query() || $query->get('post_type') !== 'project') {
        return;
    }
    
    $orderby = $query->get('orderby');
    
    switch ($orderby) {
        case 'client':
            $query->set('meta_key', 'client');
            $query->set('orderby', 'meta_value');
            break;
        case 'industry':
            $query->set('meta_key', 'industry');
            $query->set('orderby', 'meta_value');
            break;
        case 'location':
            $query->set('meta_key', 'location');
            $query->set('orderby', 'meta_value');
            break;
        case 'completion_date':
            $query->set('meta_key', 'completion_date');
            $query->set('orderby', 'meta_value');
            break;
        case 'featured_project':
            $query->set('meta_key', 'featured_project');
            $query->set('orderby', 'meta_value');
            break;
    }
}
add_action('pre_get_posts', 'handle_project_column_sorting');

// ========================================
// 13. 获取项目数据的辅助函数（前端使用）
// ========================================
function get_project_performance_metrics($post_id) {
    $metrics = array();
    
    // 获取固定性能指标
    $fixed_metrics = array(
        'power_efficiency' => '电力效率',
        'space_savings' => '空间节省',
        'installation_speed' => '安装速度提升',
        'maintenance_reduction' => '维护成本降低',
        'system_reliability' => '系统可靠性',
        'response_time' => '响应时间',
        'energy_savings' => '节能效果',
        'production_efficiency' => '生产效率提升'
    );
    
    foreach ($fixed_metrics as $field_key => $field_label) {
        $value = get_field($field_key, $post_id);
        if ($value) {
            $metrics[$field_label] = $value;
        }
    }
    
    // 获取自定义性能指标
    $custom_metrics = get_field('custom_metrics', $post_id);
    if ($custom_metrics) {
        $lines = explode("\n", $custom_metrics);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, ':') !== false) {
                $parts = explode(':', $line, 2);
                $metrics[trim($parts[0])] = trim($parts[1]);
            }
        }
    }
    
    return $metrics;
}

function get_project_products($post_id) {
    $products_text = get_field('products_used', $post_id);
    if ($products_text) {
        return array_filter(array_map('trim', explode("\n", $products_text)));
    }
    return array();
}

function get_project_images($post_id) {
    $images = array();
    for ($i = 1; $i <= 4; $i++) {
        $image = get_field('project_image_' . $i, $post_id);
        if ($image) {
            $images[] = $image;
        }
    }
    return $images;
}

// ========================================
// 14. 数据验证和错误处理增强
// ========================================
function validate_project_data($project_data) {
    $required_fields = array('title', 'description', 'content', 'metadata');
    
    foreach ($required_fields as $field) {
        if (!isset($project_data[$field]) || empty($project_data[$field])) {
            return array('valid' => false, 'message' => "缺少必要字段: {$field}");
        }
    }
    
    $required_metadata = array('client', 'industry', 'location');
    
    foreach ($required_metadata as $field) {
        if (!isset($project_data['metadata'][$field]) || empty($project_data['metadata'][$field])) {
            return array('valid' => false, 'message' => "缺少必要的元数据字段: {$field}");
        }
    }
    
    return array('valid' => true);
}

// ========================================
// 15. 导入状态日志功能
// ========================================
function log_import_status($message, $type = 'info') {
    $log_file = wp_upload_dir()['basedir'] . '/project-import.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[{$timestamp}] [{$type}] {$message}" . PHP_EOL;
    
    error_log($log_entry, 3, $log_file);
}

// ========================================
// 16. 从JSON文件读取项目完整数据
// ========================================
function load_project_data_from_json($project_title = null) {
    $json_file = '/Users/peterpc/Documents/Documents/yanghua cable web/yanghua-b2b-website/backup/projects_complete_content.json';
    
    if (!file_exists($json_file)) {
        return false;
    }
    
    $json_content = file_get_contents($json_file);
    $data = json_decode($json_content, true);
    
    if (!$data || !isset($data['projects'])) {
        return false;
    }
    
    if ($project_title) {
        foreach ($data['projects'] as $project) {
            if ($project['title'] === $project_title) {
                return $project;
            }
        }
        return false;
    }
    
    return $data['projects'];
}

// ========================================
// 17. 在项目详情页显示完整项目数据
// ========================================
function display_project_complete_data($content) {
    if (is_singular('project')) {
        global $post;
        
        // 从JSON获取完整数据
        $project_data = load_project_data_from_json($post->post_title);
        
        if ($project_data) {
            // 构建完整的项目展示内容
            $full_content = '<div class="project-complete-data">';
            
            // 项目基本信息
            $full_content .= '<div class="project-header">';
            $full_content .= '<h1 class="project-title">' . esc_html($project_data['title']) . '</h1>';
            $full_content .= '<p class="project-description">' . esc_html($project_data['description']) . '</p>';
            $full_content .= '</div>';
            
            // 项目元数据
            if (isset($project_data['metadata']) && is_array($project_data['metadata'])) {
                $metadata = $project_data['metadata'];
                
                $full_content .= '<div class="project-metadata">';
                $full_content .= '<h3>项目信息</h3>';
                $full_content .= '<table class="project-info-table">';
                
                $info_fields = array(
                    'client' => '客户',
                    'industry' => '行业',
                    'location' => '地点',
                    'duration' => '项目周期',
                    'completion_date' => '完成日期',
                    'project_scale' => '项目规模'
                );
                
                foreach ($info_fields as $key => $label) {
                    if (isset($metadata[$key]) && !empty($metadata[$key])) {
                        $full_content .= '<tr><td><strong>' . $label . ':</strong></td><td>' . esc_html($metadata[$key]) . '</td></tr>';
                    }
                }
                
                $full_content .= '</table>';
                $full_content .= '</div>';
                
                // 性能指标
                $performance_fields = array(
                    'power_efficiency' => '电力效率',
                    'space_savings' => '空间节省',
                    'installation_speed' => '安装速度',
                    'maintenance_reduction' => '维护成本降低',
                    'system_reliability' => '系统可靠性',
                    'response_time' => '响应时间',
                    'energy_savings' => '节能效果',
                    'production_efficiency' => '生产效率',
                    'downtime_reduction' => '停机时间减少',
                    'power_loss_reduction' => '功率损耗降低',
                    'system_efficiency_improvement' => '系统效率提升',
                    'maintenance_cost_reduction' => '维护成本降低'
                );
                
                $has_performance = false;
                foreach ($performance_fields as $key => $label) {
                    if (isset($metadata[$key]) && !empty($metadata[$key])) {
                        if (!$has_performance) {
                            $full_content .= '<div class="project-performance">';
                            $full_content .= '<h3>性能指标</h3>';
                            $full_content .= '<ul class="performance-list">';
                            $has_performance = true;
                        }
                        $full_content .= '<li><strong>' . $label . ':</strong> ' . esc_html($metadata[$key]) . '</li>';
                    }
                }
                
                if ($has_performance) {
                    $full_content .= '</ul>';
                    $full_content .= '</div>';
                }
                
                // 使用产品
                if (isset($metadata['products_used']) && is_array($metadata['products_used'])) {
                    $full_content .= '<div class="project-products">';
                    $full_content .= '<h3>使用产品</h3>';
                    $full_content .= '<ul class="products-list">';
                    foreach ($metadata['products_used'] as $product) {
                        $full_content .= '<li>' . esc_html($product) . '</li>';
                    }
                    $full_content .= '</ul>';
                    $full_content .= '</div>';
                }
                
                // 客户推荐
                if (isset($metadata['testimonial']) && !empty($metadata['testimonial'])) {
                    $full_content .= '<div class="project-testimonial">';
                    $full_content .= '<h3>客户评价</h3>';
                    $full_content .= '<blockquote class="testimonial-content">';
                    $full_content .= '<p>"' . esc_html($metadata['testimonial']) . '"</p>';
                    if (isset($metadata['testimonial_author']) && !empty($metadata['testimonial_author'])) {
                        $author_info = $metadata['testimonial_author'];
                        if (isset($metadata['testimonial_position']) && !empty($metadata['testimonial_position'])) {
                            $author_info .= ' - ' . $metadata['testimonial_position'];
                        }
                        $full_content .= '<cite>' . esc_html($author_info) . '</cite>';
                    }
                    $full_content .= '</blockquote>';
                    $full_content .= '</div>';
                }
            }
            
            // 项目内容
            $full_content .= '<div class="project-content">';
            $full_content .= '<h3>项目详情</h3>';
            $full_content .= '<div class="project-description-full">' . wpautop($project_data['content']) . '</div>';
            $full_content .= '</div>';
            
            // 标签
            if (isset($project_data['tags']) && is_array($project_data['tags'])) {
                $full_content .= '<div class="project-tags">';
                $full_content .= '<h3>项目标签</h3>';
                $full_content .= '<div class="tags-cloud">';
                foreach ($project_data['tags'] as $tag) {
                    $full_content .= '<span class="project-tag">' . esc_html($tag) . '</span>';
                }
                $full_content .= '</div>';
                $full_content .= '</div>';
            }
            
            // 项目时间信息
            $full_content .= '<div class="project-timeline">';
            $full_content .= '<h3>时间信息</h3>';
            $full_content .= '<p><strong>创建时间:</strong> ' . esc_html($project_data['created_at']) . '</p>';
            if (isset($project_data['updated_at']) && $project_data['updated_at'] !== $project_data['created_at']) {
                $full_content .= '<p><strong>更新时间:</strong> ' . esc_html($project_data['updated_at']) . '</p>';
            }
            $full_content .= '</div>';
            
            $full_content .= '</div>';
            
            // 添加CSS样式
            $full_content .= '<style>
                .project-complete-data {
                    max-width: 100%;
                    margin: 20px 0;
                }
                .project-header {
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .project-title {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                    color: #333;
                }
                .project-description {
                    font-size: 1.2em;
                    color: #666;
                    font-style: italic;
                }
                .project-metadata, .project-performance, .project-products, .project-testimonial, .project-content, .project-tags, .project-timeline {
                    margin: 30px 0;
                    padding: 20px;
                    background: #f9f9f9;
                    border-radius: 8px;
                }
                .project-info-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .project-info-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #eee;
                }
                .project-info-table td:first-child {
                    width: 30%;
                    font-weight: bold;
                }
                .performance-list, .products-list {
                    list-style: none;
                    padding: 0;
                }
                .performance-list li, .products-list li {
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                .testimonial-content {
                    border-left: 4px solid #007cba;
                    padding-left: 20px;
                    margin: 20px 0;
                    font-style: italic;
                }
                .testimonial-content cite {
                    display: block;
                    margin-top: 10px;
                    font-weight: bold;
                    font-style: normal;
                }
                .tags-cloud {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .project-tag {
                    display: inline-block;
                    padding: 5px 12px;
                    background: #007cba;
                    color: white;
                    border-radius: 15px;
                    font-size: 0.9em;
                }
                .project-content h3 {
                    color: #333;
                    margin-bottom: 15px;
                }
            </style>';
            
            return $full_content;
        }
    }
    
    return $content;
}

// 添加过滤器来替换项目详情页内容
add_filter('the_content', 'display_project_complete_data', 20);

// ========================================
// 18. 添加项目详情页自定义模板支持
// ========================================
function add_project_template_support() {
    if (is_singular('project')) {
        // 确保使用自定义模板
        add_filter('template_include', function($template) {
            if (is_singular('project')) {
                $custom_template = locate_template('single-project.php');
                if (!$custom_template) {
                    // 如果主题没有single-project.php，使用默认模板
                    return $template;
                }
                return $custom_template;
            }
            return $template;
        });
    }
}
add_action('template_redirect', 'add_project_template_support');

// ========================================
// 结束
// ========================================

?>

