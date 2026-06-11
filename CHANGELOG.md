# Changelog

## [1.1.0] - 2026-06-11

### Added
- 集成 device-detector-js 库 (matomo/device-detector 的 JS 移植版本) 用于精确 UA 解析
- 显示完整 IP 地址 (强制要求)
- 新增省份(prov)和区县(area)分布图表
- 新增 `/api/regions` 和 `/api/areas` 分布端点

### Changed
- IP 地理定位改用 ip9.com.cn API，获取精确的中国地理数据(省份/区县/运营商/大区)
- 最近访问表格增加"省份"、"区县"、"运营商"列
- device-detector 解析结果增加 engine/engine_version 字段

## [1.0.0] - 2026-06-11

### Added
- 初始版本发布
- IP 地理定位支持中文归属地显示
- User-Agent 解析：浏览器/操作系统/设备品牌/设备型号
- 流量概览：总浏览量、独立访客、实时数据
- 数据统计：按小时/天统计请求量
- 浏览器/OS/设备/国家/来源/网络运营商分布
- 嵌入追踪脚本支持多站点监控
- CSV 数据导出功能
- 响应式移动端布局
- 暗色主题仪表板
- 本地测试页面