CREATE TABLE
    `file_image` (
        `id` int (11) NOT NULL AUTO_INCREMENT,
        `file_list_id` int (11) NOT NULL,
        `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `sort` int (11) NULL,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT NULL,
        `deleted_at` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE = InnoDB AUTO_INCREMENT = 13 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci