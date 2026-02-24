# PocketBase Schema Details: Engineering Second Brain

Berikut adalah detail skema (fields) yang harus ditambahkan di PocketBase untuk masing-masing ke-5 collection baru.

### 1. `research_links`
Collection URL/Type: **Base**
| Field Name      | Type     | Required | Options / Rules |
|-----------------|----------|----------|-----------------|
| `user_id`       | Relation | Yes      | Collection: `users` |
| `title`         | Text     | Yes      | |
| `paper_url`     | URL      | No       | |
| `paper_file`    | File     | No       | Max size: 20MB, Allowed: .pdf |
| `tags`          | Text     | No       | |
| `notes`         | Editor/Text | No    | |
| `code_mappings` | JSON     | No       | Default: `[]` |

---

### 2. `engineering_logs`
Collection URL/Type: **Base**
| Field Name      | Type     | Required | Options / Rules |
|-----------------|----------|----------|-----------------|
| `user_id`       | Relation | Yes      | Collection: `users` |
| `title`         | Text     | Yes      | |
| `application`   | Text     | No       | |
| `category`      | Text     | No       | |
| `content`       | Editor/Text | No    | Default rendering as Markdown in UI |
| `log_date`      | Date     | No       | |

---

### 3. `derivations`
Collection URL/Type: **Base**
| Field Name      | Type     | Required | Options / Rules |
|-----------------|----------|----------|-----------------|
| `user_id`       | Relation | Yes      | Collection: `users` |
| `title`         | Text     | Yes      | |
| `description`   | Text     | No       | |
| `latex_content` | Editor/Text | No    | Plain text containing raw LaTeX |
| `application`   | Text     | No       | |
| `tags`          | Text     | No       | |
| `related_paper` | Relation | No       | Max target: 1, Collection: `research_links` |

---

### 4. `bibliography`
Collection URL/Type: **Base**
| Field Name      | Type     | Required | Options / Rules |
|-----------------|----------|----------|-----------------|
| `user_id`       | Relation | Yes      | Collection: `users` |
| `title`         | Text     | Yes      | |
| `authors`       | Text     | No       | |
| `year`          | Number   | No       | |
| `journal`       | Text     | No       | |
| `doi`           | Text     | No       | |
| `abstract`      | Editor/Text | No    | |
| `file`          | File     | No       | Max size: 20MB, Allowed: .pdf |
| `tags`          | Text     | No       | |
| `status`        | Select   | Yes      | Values: `to_read`, `in_progress`, `read`, `implemented`. Default: `to_read` |
| `notes`         | Editor/Text | No    | |

---

### 5. `documentations`
Collection URL/Type: **Base**
| Field Name      | Type     | Required | Options / Rules |
|-----------------|----------|----------|-----------------|
| `user_id`       | Relation | Yes      | Collection: `users` |
| `title`         | Text     | Yes      | |
| `content`       | Editor/Text | No    | Pure markdown contents |
| `category`      | Text     | No       | |
| `tags`          | Text     | No       | |
| `file`          | File     | No       | Max size: 10MB, Allowed: .md, .txt |

---

### 6. `second_brains`
Collection URL/Type: **Base**
| Field Name      | Type     | Required | Options / Rules |
|-----------------|----------|----------|-----------------|
| `user_id`       | Relation | Yes      | Collection: `users` |
| `title`         | Text     | Yes      | |
| `tags`          | Text     | No       | |
| `content`       | Editor/Text | No    | Pure markdown contents |
| `linked_nodes`  | Relation | No       | Max target: No limit, Collection: `second_brains` |

---
**API Rules:**
Untuk setiap collection di atas, pada bagian **API Rules**, Anda bisa mengaturnya ke `Admin Only` (kosongkan gembok atau berikan akses spesifik hanya untuk admin) sesuai kebutuhan sistem admin panel ini.
