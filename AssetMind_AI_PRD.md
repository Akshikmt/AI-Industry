# AssetMind AI
## Transforming Industrial Documents into Actionable Intelligence

**Document Type:** Product Requirements Document
**Version:** 1.0
**Status:** Draft
**Product Category:** Enterprise SaaS / Industrial Knowledge Intelligence
**Target Release:** MVP for Hackathon → Production Roadmap
**Prepared For:** Product, Engineering, Design, and Stakeholders

---

## 1. Executive Summary

AssetMind AI is a role-based industrial knowledge intelligence platform that converts scattered industrial documents into a searchable, connected, and AI-assisted knowledge system.

The product ingests engineering drawings, SOPs, maintenance reports, inspection records, manuals, compliance documents, work orders, and incident reports, then extracts structured knowledge and makes it available through semantic search, AI copilot answers, and knowledge graph relationships.

The key business outcome is to reduce time spent searching for information, preserve institutional knowledge, improve operational decision-making, and make industrial knowledge available at the point of need. The MVP is designed to be realistic for a hackathon while remaining strong enough to evolve into a production SaaS product.

---

## 2. Problem Statement

Industrial organizations manage critical knowledge across disconnected systems and document formats. Important information is scattered across PDFs, scanned files, emails, shared drives, and paper-based records, making it difficult to find the right answer quickly.

This fragmentation causes:
- Wasted time searching for documents
- Incomplete context during maintenance and operations
- Slower troubleshooting
- Missed compliance evidence
- Loss of institutional knowledge when experienced workers retire

AssetMind AI addresses this problem by turning documents into a centralized industrial knowledge system with retrieval, context, and relationships.

---

## 3. Product Vision

AssetMind AI will become the operational memory layer for industrial organizations. It will help users ask questions in natural language, understand the relationships between assets and documents, and access reliable answers backed by source evidence.

The long-term vision is to support not just search, but intelligent decision support for maintenance, quality, compliance, and engineering workflows.

---

## 4. Product Goals

### Primary Goals
- Centralize industrial document knowledge
- Make industrial information searchable and contextual
- Reduce time to answer operational questions
- Preserve hidden expert knowledge
- Provide trustworthy AI answers with citations

### Secondary Goals
- Create a professional enterprise-grade UX
- Support secure role-based access
- Lay the foundation for future maintenance intelligence and compliance automation

---

## 5. Success Metrics

### MVP Success Metrics
- Admin can upload documents successfully with status tracking
- At least 90% of test queries return a cited answer
- Employees can find answers faster than manual document search
- Role-based access correctly blocks unauthorized actions
- Asset pages and knowledge graph previews are understandable in a demo

### Product Success Metrics
- Reduction in average search time
- Increased document reuse
- Higher confidence in maintenance decisions
- More complete knowledge discovery across departments

---

## 6. Target Audience

AssetMind AI is industry-agnostic and should work across:
- Manufacturing
- Oil & gas
- Power plants
- Automobile
- Pharmaceuticals
- Mining
- Steel
- Construction
- Chemical plants
- Utilities

The product should adapt to any document-heavy industrial environment where operational knowledge is distributed and difficult to access.

---

## 7. User Roles

### 7.1 Admin

**Permissions**
- Login
- Upload documents
- Delete documents
- View all documents
- View processing status
- View assets
- View knowledge graph
- Use AI copilot
- View AI insights
- Manage document ingestion

**Access Model**
Admin has full control over document governance, ingestion, and internal intelligence workflows.

### 7.2 Employee

**Permissions**
- Login
- Search documents
- Use AI copilot
- View assets
- View knowledge graph
- View citations
- View source documents
- View AI insights

**Restrictions**
- Cannot upload documents
- Cannot delete documents
- Cannot manage users

Employees are read-only consumers of the knowledge system.

---

## 8. Product Principles

1. **Trust over flashiness.** Every answer must be grounded in source documents.
2. **Role clarity.** Admins manage knowledge; employees consume knowledge.
3. **Industrial usability.** Design for plant engineers, technicians, and managers.
4. **Fast path to value.** The first release should solve one end-to-end workflow.
5. **Scalable foundation.** Choose architecture that can expand into production features later.

---

## 9. Competitive Context

AssetMind AI sits in the space between enterprise document search, RAG systems, and industrial knowledge management platforms.

**Differentiation**
- Not just PDF chat
- Not just document storage
- Not just keyword search
- Combines retrieval, citations, entity extraction, and knowledge graph relationships

**Why This Matters**
Knowledge graphs improve enterprise AI by representing relationships that plain vector retrieval may miss.

---

## 10. MVP Scope

### 10.1 In Scope
- Authentication
- Role-based access control
- Admin document upload and deletion
- Document processing status
- OCR for scanned documents
- Entity extraction
- Document chunking
- Embeddings
- Vector search
- Knowledge graph preview
- AI copilot
- Citations
- Confidence score
- Asset page
- AI insights
- Recent activity

### 10.2 Out of Scope
- Predictive maintenance
- Live IoT or sensor integration
- SAP/ERP integrations
- Voice assistant
- Mobile native app
- Full compliance automation

---

## 11. Core User Flows

### 11.1 Admin Flow
1. Admin logs in.
2. Admin uploads one or more documents.
3. OCR runs if files are scanned.
4. Entity extraction identifies assets, people, dates, failure types, SOPs, and compliance references.
5. Documents are chunked and embedded.
6. Search index and graph records are updated.
7. Admin views processing status and AI insights.

### 11.2 Employee Flow
1. Employee logs in.
2. Employee searches by keyword or asks a question.
3. System retrieves relevant chunks.
4. AI generates an answer using retrieved context.
5. Response includes citations, confidence score, related assets, and related documents.

### 11.3 Asset Flow
1. User opens an asset.
2. Sees asset summary, timeline, related reports, SOPs, and inspections.
3. User asks AI about this asset.
4. AI returns a focused asset-specific answer.

---

## 12. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Users must be able to authenticate securely. | P0 |
| FR-2 | Role-based access must be enforced in UI and backend. | P0 |
| FR-3 | Admin must be able to upload documents. | P0 |
| FR-4 | System must extract text from scanned and digital files. | P0 |
| FR-5 | System must chunk documents for retrieval. | P0 |
| FR-6 | System must generate embeddings for semantic search. | P0 |
| FR-7 | System must extract entities from documents. | P0 |
| FR-8 | Users must be able to search and ask questions. | P0 |
| FR-9 | Answers must include citations and source references. | P0 |
| FR-10 | System must display related assets and documents. | P1 |
| FR-11 | System must show a knowledge graph preview. | P1 |
| FR-12 | System must generate AI insights from document patterns. | P1 |
| FR-13 | System must log recent activity and uploads. | P1 |

---

## 13. Non-Functional Requirements

### Performance
- Search and answer flow should feel fast and responsive.
- Document processing may be asynchronous, but users must see clear progress.

### Security
- JWT-based authentication
- Supabase RLS
- File validation
- Input validation
- Rate limiting
- Secure file storage

### Usability
- Mobile-friendly UI
- Accessible design
- Clear enterprise navigation
- Minimal clicks to reach search or upload

### Reliability
- Processing failures should be visible.
- Low-confidence answers should be handled gracefully.
- System should not fabricate unsupported answers.

---

## 14. Wireframe Descriptions

### 14.1 Landing Page
- Logo
- Product title
- One-line value proposition
- Login button
- Optional request access button
- Short explanation of admin vs. employee roles

### 14.2 Login Page
- Email
- Password
- Sign in button
- Forgot password
- Small note about secure access

### 14.3 Admin Dashboard
- Sidebar: Dashboard, Documents, Assets, AI Copilot, Knowledge Graph, AI Insights, Profile
- Cards: total documents, total assets, employees, critical alerts
- Charts: documents processed over time
- Sections: recent uploads, document status, quick actions

### 14.4 Employee Dashboard
- Sidebar: Dashboard, Assets, AI Copilot, Knowledge Graph, Documents, Profile
- Cards: available assets, accessible documents, AI queries, alerts
- Sections: recent documents, recent conversations, frequently accessed assets, quick search

---

## 15. Document Ingestion Design

### Supported Formats
- PDF
- Images
- DOCX
- TXT
- Excel
- Scanned PDFs

### Ingestion Steps
1. Upload file.
2. Validate file type and size.
3. Store original file.
4. Extract text.
5. OCR scanned pages when necessary.
6. Chunk extracted content.
7. Create embeddings.
8. Save document metadata.
9. Update graph relationships.
10. Mark document as ready.

---

## 16. Entity Extraction Design

The system should extract:
- Asset name
- Equipment tag
- Engineer name
- Department
- Date
- Failure type
- Inspection
- Maintenance event
- Temperature
- Pressure
- Voltage
- Current
- Compliance reference
- SOP number

Entity extraction should support both structured and unstructured content, and results should be stored for later search and graph linking.

---

## 17. Knowledge Graph Design

### Graph Objective
The knowledge graph should connect industrial entities so users can navigate from one concept to related operational context.

### Core Node Types
- Asset
- Maintenance Event
- Inspection
- Manual
- SOP
- Engineer
- Incident
- Compliance Reference
- Work Order
- Document

### Core Relationships
- Asset has Maintenance Event
- Asset has Inspection
- Asset referenced in Manual
- SOP applies to Asset
- Engineer performed Maintenance Event
- Incident linked to Asset
- Work Order resolves Failure
- Compliance Reference maps to SOP or Inspection

### Graph Generation Logic
1. Extract entities from chunks.
2. Normalize entity names.
3. Match entities against asset master data.
4. Create node records.
5. Create relationship edges.
6. Reconcile duplicate entities.
7. Update graph after each new upload.

### MVP Graph Scope
For MVP, a simplified graph is acceptable if Neo4j is too heavy. The graph should still show meaningful links between assets, documents, inspections, maintenance records, and SOPs.

---

## 18. AI Copilot Requirements

The AI copilot should support questions like:
- Why did Pump P-101 fail?
- Show maintenance history.
- Which SOP should be followed?
- Show related documents.
- Which engineer repaired this asset?
- What inspections are overdue?

### Copilot Response Format
- Natural language answer
- Confidence score
- Source citations
- Related assets
- Related documents
- Knowledge graph preview

### Copilot Behavior
- Use retrieved context only.
- Refuse to answer when evidence is weak.
- Be transparent when confidence is low.
- Prefer concise and operationally useful answers.

---

## 19. AI Insights Requirements

The system should generate proactive insights such as:
- Repeated overheating detected
- Repeated lubrication issues
- Inspection overdue
- Missing SOP
- Frequent maintenance
- Potential compliance gap

These insights should be rule-informed or pattern-informed, and clearly labeled as AI-generated recommendations rather than authoritative operational decisions.

---

## 20. Asset Detail Page

Each asset page should include:
- Asset overview
- Asset details
- Maintenance timeline
- Inspection reports
- Related documents
- SOPs
- AI summary
- Ask AI about this asset

The asset page should be the main bridge between documents and operational context.

---

## 21. RAG Pipeline

### Pipeline
OCR → Chunking → Embeddings → Vector DB → Retriever → Gemini → Answer → Citation

### Retrieval Strategy
- Retrieve top relevant chunks.
- Include graph-linked context when available.
- Rerank if necessary.
- Ground the answer in the retrieved evidence.

### Output Quality
- Cite every factual answer.
- Return confidence score.
- Show related document snippets.
- Avoid unsupported speculation.

---

## 22. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS, Shadcn UI |
| Backend | Node.js + Express |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| OCR | Tesseract OCR |
| Embeddings | Gemini Embedding API |
| LLM | Gemini 2.5 Flash |
| Vector Search | pgvector |
| Knowledge Graph | Neo4j or simplified graph implementation for MVP |

---

## 23. Security Requirements

- JWT authentication
- Role-based access control
- Supabase RLS
- File type validation
- File size validation
- Secure storage
- Environment variables for secrets
- Input sanitization
- XSS protection
- CSRF protection where applicable
- Rate limiting

---

## 24. Database Schema

**profiles**
- id, name, email, role, created_at

**documents**
- id, title, file_url, file_type, uploaded_by, status, created_at

**document_chunks**
- id, document_id, chunk_text, embedding, page_number

**entities**
- id, chunk_id, entity_type, entity_value, confidence

**assets**
- id, asset_name, equipment_tag, department

**relationships**
- id, source_type, source_id, target_type, target_id, relation_type

**queries**
- id, user_id, question, answer, confidence, created_at

**activity_logs**
- id, user_id, action, target_id, timestamp, metadata

---

## 25. API Design

**Auth**
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Documents**
- `POST /api/documents/upload`
- `GET /api/documents`
- `GET /api/documents/:id`
- `DELETE /api/documents/:id`

**Search**
- `POST /api/search`

**Copilot**
- `POST /api/copilot/ask`

**Assets**
- `GET /api/assets`
- `GET /api/assets/:id`

**Insights**
- `GET /api/insights`

**Graph**
- `GET /api/graph`
- `GET /api/graph/:assetId`

**Logs**
- `GET /api/activity`

---

## 26. Folder Structure

```text
assetmind-ai/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── styles/
│   └── public/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── agents/
│   │   ├── utils/
│   │   └── middleware/
│   └── tests/
├── database/
│   ├── schema.sql
│   └── rls-policies.sql
├── docs/
│   ├── prd.md
│   ├── api.md
│   └── architecture.md
└── deployment/
    └── docker/
```

---

## 27. Architecture Overview

```text
User
  ↓
Next.js Frontend
  ↓
Supabase Auth + RBAC
  ↓
Node.js API
  ↓
OCR / Extraction / Graph / RAG Services
  ↓
Supabase Postgres + pgvector + Storage
  ↓
Knowledge Graph Store
  ↓
Gemini LLM
  ↓
Cited Answer + Insights
```

---

## 28. Deployment Architecture

- Frontend deployed on Vercel or similar.
- Backend deployed on Render or similar.
- Database on Supabase.
- File storage on Supabase Storage.
- Optional graph database on Neo4j Cloud or equivalent.

The deployment should support a hackathon demo first and later production hardening.

---

## 29. Testing Strategy

**Functional Testing**
- Login flow
- Admin upload
- Employee search
- Citation correctness
- Role restrictions

**AI Testing**
- Query quality
- Hallucination checks
- Citation presence
- Confidence scoring

**Security Testing**
- Unauthorized access
- File validation
- RLS verification
- Input sanitization

**UX Testing**
- Mobile responsiveness
- Simple navigation
- Demo usability

---

## 30. Development Roadmap

**Sprint 1** — Auth, RBAC, Landing page, Dashboard shell
**Sprint 2** — Upload, OCR, Storage, Document list
**Sprint 3** — Chunking, Embeddings, Search
**Sprint 4** — Copilot, Citations, Asset pages
**Sprint 5** — Knowledge graph, AI insights, Activity logs
**Sprint 6** — Polish, Demo scripts, Performance improvements

---

## 31. Future Roadmap

- Predictive maintenance
- Root cause analysis
- Live sensor integration
- Compliance automation
- ERP/SAP connectors
- Multi-site deployments
- Voice-based industrial assistant
- Mobile app

---

## 32. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Poor OCR quality | Preprocessing, OCR fallback, manual review |
| Hallucinated AI answers | Citations, confidence scoring, grounded retrieval, refusal behavior |
| Scope creep | Freeze MVP scope and defer advanced modules |
| Graph complexity | Start with simplified graph and expand later |
| Security leakage | Strict RBAC, RLS, and secure file storage |

---

## 33. Assumptions

- Users have access to industrial documents in common file formats.
- Admins can be trusted to upload relevant content.
- Documents may include scanned pages requiring OCR.
- MVP will use sample industrial documents for demo if real files are unavailable.
- AI answers will be grounded in retrieved documents, not free-form generation alone.

---

## 34. Acceptance Criteria

- Admin can log in and upload a document.
- System processes the document and marks it ready.
- Employee can search and ask a question.
- Answer includes citations and confidence.
- Asset page shows related knowledge.
- Role restrictions work correctly.
- Demo flow can be completed without explanation overload.

---

## 35. Hackathon Demo Flow

1. Open landing page.
2. Log in as admin.
3. Upload an industrial document.
4. Show extraction and processing status.
5. Log in as employee.
6. Ask a question about an asset or failure.
7. Show cited answer, confidence, related documents, and graph.
8. Open asset page and show timeline plus AI summary.
9. End with: "This can scale into maintenance and compliance intelligence."

---

## 36. Presentation Strategy

The presentation should emphasize:
- The industrial problem
- The cost of fragmented knowledge
- The trustworthiness of cited answers
- The enterprise security model
- The long-term platform value

A strong closing line is:

> **AssetMind AI is not just a document chatbot. It is a digital memory system for industrial operations.**

---

## 37. Business Value

AssetMind AI can help organizations:
- Reduce search time
- Improve decision-making
- Preserve institutional knowledge
- Improve maintenance coordination
- Support compliance evidence discovery
- Reduce dependency on tribal knowledge

---

## 38. Innovation

The product is innovative because it combines OCR, entity extraction, vector retrieval, knowledge graph relationships, role-based access, and AI copilot answers into one industrial knowledge layer.

---

## 39. Final Conclusion

AssetMind AI is a strong enterprise-grade MVP because it addresses a real industrial pain point with a realistic build scope and a credible path to production. It is focused enough to build quickly, but deep enough to impress both technical and non-technical stakeholders.
