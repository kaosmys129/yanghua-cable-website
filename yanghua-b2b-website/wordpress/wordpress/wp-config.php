<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress_yanghua' );

/** Database username */
define( 'DB_USER', 'wp_user' );

/** Database password */
define( 'DB_PASSWORD', 'wp_password_2024' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'ZyhUWuSxU_2,2Q(9:@!9L(F<o-XJx^Uk#$S:L/|8-g[s9hlyaz:EW0_z|K(rQy`{');
define('SECURE_AUTH_KEY',  'rtS%U.fX(}~WR1q1#E|(bqfUi1xe?ASRYbKZ>R&1W?FhtS6Wv~Jh_EGRjHt8kmZ5');
define('LOGGED_IN_KEY',    'VLw3y%iuu*T;V*98N.EW~KcHCIOg3H9N&l[%xZ5=N(@ljdc9=<pn nUpL/Wm@5os');
define('NONCE_KEY',        '^h^o/Rsa|K58C.U*nipEc_5-47u&GJ&NRa)2I!|ZTJ/3,+BrFmm$&0svHrsi0=]=');
define('AUTH_SALT',        'z<sQ7;uNUnFOC&`n3k||w;|1sm*V)?>x<K_r6[:VP3p}5K=y[I(LM,aN:iF)*- 2');
define('SECURE_AUTH_SALT', 'hG;c-&cIdV=yywmfV(^b7^2-:oRp{CiN}Q1K@!};$AF5gi|]-0lM25qM/8!Qx|5p');
define('LOGGED_IN_SALT',   '$gYu8}o5vl]R:XsNs|U I7z2{+:FL{r kuPrCc|SD=#ZOMu!w8)}@M-U!1e&oC#O');
define('NONCE_SALT',       'E`zCp`NyqqHwnDTw1IEGtV-2A$Ge|=LtXg?3UV!|X*KL8V|y`V-98W?</zPhck3T');

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

/**
 * WordPress REST API settings
 */
define( 'WP_REST_API_ENABLED', true );

/**
 * WordPress multisite settings (if needed)
 */
// define( 'WP_ALLOW_MULTISITE', true );

/**
 * WordPress memory limit
 */
define( 'WP_MEMORY_LIMIT', '256M' );

/**
 * WordPress file permissions
 */
define( 'FS_METHOD', 'direct' );

/* Add any custom values between this line and the "stop editing" comment. */

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';