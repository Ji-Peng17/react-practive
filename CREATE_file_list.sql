CREATE TABLE
    `file_list` (
        `id` int (11) NOT NULL AUTO_INCREMENT,
        `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `prompt` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `class` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `origin_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `path_check` bit (1) DEFAULT b '1',
        `target_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `target_check` bit (1) DEFAULT NULL,
        `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT NULL,
        `deleted_at` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE = InnoDB AUTO_INCREMENT = 13 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci