-- 创建数据库
CREATE DATABASE IF NOT EXISTS oauth2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE oauth2;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_78a916df40e02a9deb1c4b75ed` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建客户端表
CREATE TABLE IF NOT EXISTS `client` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` varchar(255) NOT NULL,
  `client_secret` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `grants` text NOT NULL,
  `redirect_uris` text NOT NULL,
  `scope` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_6436cc6b79593760b9ef921ef1` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建授权码表
CREATE TABLE IF NOT EXISTS `auth_code` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `redirect_uri` varchar(255) NOT NULL,
  `scope` text NOT NULL,
  `user_id` int NOT NULL,
  `client_id` int NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_c8c7a2b32e7a74668f4c9d1a4d` (`code`),
  KEY `FK_user_auth_code` (`user_id`),
  KEY `FK_client_auth_code` (`client_id`),
  CONSTRAINT `FK_user_auth_code` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_client_auth_code` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建访问令牌表
CREATE TABLE IF NOT EXISTS `access_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `scope` text NOT NULL,
  `user_id` int NOT NULL,
  `client_id` int NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_f20f028607b2603deabd8182d1` (`token`),
  KEY `FK_user_access_token` (`user_id`),
  KEY `FK_client_access_token` (`client_id`),
  CONSTRAINT `FK_user_access_token` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_client_access_token` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建刷新令牌表
CREATE TABLE IF NOT EXISTS `refresh_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `scope` text NOT NULL,
  `user_id` int NOT NULL,
  `client_id` int NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_8e913e288156c133999341156c` (`token`),
  KEY `FK_user_refresh_token` (`user_id`),
  KEY `FK_client_refresh_token` (`client_id`),
  CONSTRAINT `FK_user_refresh_token` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_client_refresh_token` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试数据
INSERT INTO `user` (`username`, `password`) VALUES 
('testuser', '$2b$10$ng5ABe5YHfZhTP0BiyXRCezZN3.qs3qWVEgC6y2dB4A5F0LXqL.Uy');

INSERT INTO `client` (`client_id`, `client_secret`, `name`, `grants`, `redirect_uris`, `scope`) VALUES 
('testclient', 'testclientsecret', 'Test Client', 'authorization_code,refresh_token,password', 'http://localhost:3000/callback', 'read,write'); 