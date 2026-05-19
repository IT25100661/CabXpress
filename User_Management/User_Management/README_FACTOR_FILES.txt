CabXpress - User Management

This folder contains source files copied from the original project and grouped by feature area.
Some common/shared files are included because the separated feature code depends on them.

Excluded from all packages:
- node_modules/
- backend/target/ compiled files
- backend/.idea/ IDE settings
- private .env files

Files included (61):
- .env.example
- .gitignore
- CHANGELOG.md
- README.md
- backend/.env.example
- backend/.mvn/wrapper/maven-wrapper.properties
- backend/mvnw
- backend/mvnw.cmd
- backend/pom.xml
- backend/src/main/java/com/cabxpress/CabXpressApplication.java
- backend/src/main/java/com/cabxpress/config/DataInitializer.java
- backend/src/main/java/com/cabxpress/config/OpenApiConfig.java
- backend/src/main/java/com/cabxpress/config/SecurityConfig.java
- backend/src/main/java/com/cabxpress/config/WebConfig.java
- backend/src/main/java/com/cabxpress/controller/AuthController.java
- backend/src/main/java/com/cabxpress/controller/NotificationController.java
- backend/src/main/java/com/cabxpress/controller/UserController.java
- backend/src/main/java/com/cabxpress/dto/ApiDtos.java
- backend/src/main/java/com/cabxpress/entity/Notification.java
- backend/src/main/java/com/cabxpress/entity/OtpVerification.java
- backend/src/main/java/com/cabxpress/entity/User.java
- backend/src/main/java/com/cabxpress/enums/NotificationPriority.java
- backend/src/main/java/com/cabxpress/enums/NotificationType.java
- backend/src/main/java/com/cabxpress/enums/Role.java
- backend/src/main/java/com/cabxpress/exception/ApiException.java
- backend/src/main/java/com/cabxpress/exception/GlobalExceptionHandler.java
- backend/src/main/java/com/cabxpress/repository/NotificationRepository.java
- backend/src/main/java/com/cabxpress/repository/OtpVerificationRepository.java
- backend/src/main/java/com/cabxpress/repository/UserRepository.java
- backend/src/main/java/com/cabxpress/security/CustomUserDetailsService.java
- backend/src/main/java/com/cabxpress/security/JwtAuthenticationFilter.java
- backend/src/main/java/com/cabxpress/security/JwtService.java
- backend/src/main/java/com/cabxpress/service/AuthService.java
- backend/src/main/java/com/cabxpress/service/EmailService.java
- backend/src/main/java/com/cabxpress/service/NotificationService.java
- backend/src/main/java/com/cabxpress/util/OtpUtil.java
- backend/src/main/resources/application.properties
- backend/src/main/resources/data.sql
- frontend/.env.example
- frontend/index.html
- frontend/package-lock.json
- frontend/package.json
- frontend/postcss.config.js
- frontend/src/App.tsx
- frontend/src/api/client.ts
- frontend/src/components/NotificationBell.tsx
- frontend/src/components/ui.tsx
- frontend/src/layouts/AdminLayout.tsx
- frontend/src/layouts/PublicLayout.tsx
- frontend/src/layouts/UserLayout.tsx
- frontend/src/main.tsx
- frontend/src/pages/AdminPages.tsx
- frontend/src/pages/AuthPages.tsx
- frontend/src/pages/UserPages.tsx
- frontend/src/store/auth.tsx
- frontend/src/styles/index.css
- frontend/src/utils/format.ts
- frontend/src/vite-env.d.ts
- frontend/tailwind.config.js
- frontend/tsconfig.json
- frontend/vite.config.ts