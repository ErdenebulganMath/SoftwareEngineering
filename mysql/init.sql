SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS learning_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learning_db;

CREATE TABLE IF NOT EXISTS courses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)   NOT NULL,
    description TEXT           NOT NULL,
    price       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    course_id     INT NOT NULL,
    title         VARCHAR(255) NOT NULL,
    file_path     VARCHAR(512) NOT NULL,
    file_type     VARCHAR(50)  NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT INTO courses (title, description, price) VALUES
('Python програмчлалын үндэс',
 'Python хэлний суурь ойлголтоос эхлэн хувьсагч, нөхцөл, давталт, функц, OOP зарчим хүртэл системтэйгээр судална. Бодлого бодох, алгоритм боловсруулах дадлага хийнэ.',
 49900.00),

('Орчин үеийн веб хөгжүүлэлт',
 'HTML5, CSS3, JavaScript ашиглан бодит төслүүд хийнэ. Flexbox, Grid layout, responsive дизайн болон Bootstrap framework-тэй ажиллах мэдлэг эзэмшинэ.',
 79900.00),

('Flask API хөгжүүлэлт',
 'Python Flask framework ашиглан RESTful API бүтээх — endpoint тодорхойлох, JSON өгөгдөл дамжуулах, CORS тохируулах, MySQL мэдээллийн сантай холбох бүрэн ойлголт авна.',
 59900.00),

('Docker болон DevOps практик',
 'Контейнерчлэлийн технологи: Docker image, container, volume, network болон docker-compose ашиглах арга. CI/CD pipeline тохируулах, GitHub Actions, production deploy хийх дадлага.',
 89900.00),

('MySQL мэдээллийн сан',
 'Мэдээллийн сангийн зохион байгуулалт, хүснэгт загварчлал, SELECT/INSERT/UPDATE/DELETE командууд, JOIN хэлбэрүүд, индекс болон гүйцэтгэлийн оновчлол.',
 39900.00),

('React.js фронтенд хөгжүүлэлт',
 'React library ашиглан компонент суурилсан UI бүтээх. useState, useEffect hooks, props дамжуулах, React Router ашиглан SPA хийх, өгөгдлийн менежмент хийх.',
 69900.00),

('Git болон хувилбарын удирдлага',
 'Git системийн үндэс: commit, branch, merge, rebase ойлголтууд. GitHub дээр багаар хамтран ажиллах, pull request гаргах, merge conflict шийдвэрлэх практик.',
 29900.00),

('JavaScript дэвшилтэт сэдвүүд',
 'Promises, async/await, closure, prototype, event loop болон ES6+ синтакс. Гүйцэтгэл оновчлол, browser API, localStorage, fetch API ашиглах арга техник.',
 64900.00);
