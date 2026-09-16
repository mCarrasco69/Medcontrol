-- ============================================================
-- Schema de la base de datos medicamentos_app
-- Ejecutar este archivo en MySQL para crear la base de datos
-- y todas las tablas necesarias para el backend.
-- ============================================================

CREATE DATABASE IF NOT EXISTS medicamentos_app
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE medicamentos_app;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Tabla: perfiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `perfiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `relacion` varchar(50) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `perfiles_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Tabla: medicamentos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medicamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perfil_id` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `dosis` varchar(50) NOT NULL,
  `unidad` varchar(10) DEFAULT NULL,
  `presentacion` varchar(30) DEFAULT 'tableta',
  `cantidad` int DEFAULT '1',
  `frecuencia` varchar(50) NOT NULL,
  `duracion_dias` int DEFAULT NULL,
  `notas` text,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `perfil_id` (`perfil_id`),
  CONSTRAINT `medicamentos_ibfk_1` FOREIGN KEY (`perfil_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Tabla: horarios_toma
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `horarios_toma` (
  `id` int NOT NULL AUTO_INCREMENT,
  `medicamento_id` int NOT NULL,
  `hora` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `medicamento_id` (`medicamento_id`),
  CONSTRAINT `horarios_toma_ibfk_1` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamentos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Tabla: historial_tomas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `historial_tomas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `medicamento_id` int NOT NULL,
  `perfil_id` int NOT NULL,
  `fecha_programada` datetime NOT NULL,
  `fecha_tomada` datetime DEFAULT NULL,
  `estado` enum('pendiente','tomada','omitida','atrasada') DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `medicamento_id` (`medicamento_id`),
  KEY `perfil_id` (`perfil_id`),
  CONSTRAINT `historial_tomas_ibfk_1` FOREIGN KEY (`medicamento_id`) REFERENCES `medicamentos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_tomas_ibfk_2` FOREIGN KEY (`perfil_id`) REFERENCES `perfiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
