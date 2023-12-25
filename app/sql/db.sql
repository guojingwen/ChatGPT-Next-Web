create database `ai-teacher` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

use `ai-teacher`;

-- 获取微信js-sdk权限 jsticket
DROP TABLE IF EXISTS `jsticket`;
CREATE TABLE `jsticket` (
  `id` smallint(1)  NOT NULL AUTO_INCREMENT,
  `ticket` char(100) NOT NULL ,
  `assess_token` char(150) NOT NULL,
  `create_time` datetime NOT NULL,
  `expire_time` BIGINT(13)  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
-- insert into `jsticket` (`ticket`,`assess_token`,`create_time`, `expire_time`) values ('xxxx', 'yyy', '2021-05-25 11:07:00', '2021-09-17 20:25:00');

-- 微信网页授权accesstoken缓存
DROP TABLE IF EXISTS `wxauth`;
CREATE TABLE `wxauth` (
  `id` smallint(1)  NOT NULL AUTO_INCREMENT,
  `openid` char(40) NOT NULL,
  `access_token` char(150) NOT NULL,
  `expires_in` SMALLINT(5)  NOT NULL,
  `refresh_token` char(150) NOT NULL,
  `scope` varchar(100) DEFAULT NULL,
  `is_snapshotuser`TINYINT DEFAULT 0 COMMENT '只有当用户是快照页模式虚拟账号时返回，值为1',
  `unionid` char(150) DEFAULT NULL,
  `create_time` datetime NOT NULL COMMENT '从微信服务器更新的时间',
  `access_token_expires_time` BIGINT(13)  NOT NULL,
  `refresh_token_expires_time` BIGINT(13)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `openid` (`openid`)
) ENGINE=InnoDB  AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

-- 微信用户信息缓存
DROP TABLE IF EXISTS `wxuser`;
CREATE TABLE `wxuser` (
  `id` smallint(1)  NOT NULL AUTO_INCREMENT,
  `openid` char(40) NOT NULL,
  `nickname` varchar(100) NOT NULL,
  `sex` TINYINT DEFAULT 0,
  `province` char(20) DEFAULT NULL,
  `city` char(20) DEFAULT NULL,
  `country` char(20) DEFAULT NULL,
  `headimgurl` varchar(150) DEFAULT NULL,
  `privilege` varchar(200) DEFAULT NULL,
  `unionid` char(40) DEFAULT NULL,
  `create_time` datetime NOT NULL COMMENT '从微信服务器获取的时间',
  `update_time` datetime NOT NULL COMMENT '从微信服务器更新的时间',
  `balance` int DEFAULT 0 COMMENT '用户余额',
  PRIMARY KEY (`id`),
  UNIQUE KEY `openid` (`openid`)
) ENGINE=InnoDB  AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


