# Luqma API Contract Audit — Owner Dashboard Phase 2

**Base URL:** `https://luqma-api.runasp.net`
**Audit date:** 2026-11-24
**Status:** Partial, safety-first integration; Store critical operations remain blocked.

This audit covers the existing frontend, the supplied integration brief, the
workspace copy at [`docs/api/swagger.json`](./swagger.json), and the public
Swagger document at
[`https://luqma-api.runasp.net/swagger/v1/swagger.json`](https://luqma-api.runasp.net/swagger/v1/swagger.json).
The Swagger document was read as documentation only. No authenticated API
request was made and no live account was used.

A separate read-only inspection found a public C# repository that appears to be
a backend source candidate (`minasameh11/luqma`, commit `2d7dc23489c7`). It is
not present in this dashboard checkout and its deployment linkage is not
proven. Its Store DTOs omit `ownerEmail`/`ownerPassword`, while the deployed
Swagger includes them; source findings below are therefore implementation
evidence to reconcile, not a substitute for the deployed contract.

## Authorization boundary

- The dashboard accepts only the exact string role `Owner`.
- `Admin`, `User`, numeric roles, mixed-case values, and all unsupported roles
  are rejected by login/session/profile validation.
- Swagger declares a global Bearer security scheme, but it does not describe
  per-operation roles or owner permissions. The backend must remain
  authoritative for the Owner role and every resource ownership check.
- `GetProfile` does not document a `storeId`, and its successful response has
  no OpenAPI response schema. The supplied brief's profile example is used for
  strict parsing, including the exact `Owner` role check.
- No documented endpoint returns a verified mapping between the authenticated
  Owner and a Store. `Store/GetAll` is a public-looking listing shape with
  filters, no response schema, and no owner-specific semantics. It is not used
  as an ownership source.

## Endpoints implemented safely

| Endpoint | Contract reviewed | Frontend status |
|---|---|---|
| `POST /api/Account/Login` | `{ email, password }`; existing envelope/login identity from the brief | Implemented before this phase; exact Owner gate retained |
| `POST /api/Account/Logout` | No body; HTTP 200; no response schema | Implemented. Captures the Bearer token, clears local/session and protected in-memory state first, then attempts remote logout. A remote failure cannot restore local authentication. |
| `GET /api/Account/GetProfile` | Brief envelope and profile example; Swagger has no response schema | Implemented with strict envelope/profile parsing and exact `Owner` validation |
| `PUT /api/Account/UpdateProfile` | `UpdateProfileRequest` has exactly `userName`, `email`, `phoneNumber`, `address`; no required list; HTTP 200 without a schema | Implemented with client validation, exact request serialization, safe server-error handling, and a profile refresh after success |
| `GET /api/MainCategory/GetAll?onlyActive=true` | Query parameter is documented; item shape comes from the brief; Swagger has no response schema | Implemented read-only service. It uses `onlyActive=true` by default, validates items, filters active entries defensively, and sorts by `displayOrder`. No main-category mutations are exposed. |

The account and category services use the existing centralized API client, so
Bearer attachment, 401 session invalidation, 403 errors, timeouts, network
errors, and malformed JSON are normalized in one place.

## Store contract findings

The live Swagger `UpdateStoreRequest` contains these properties, all without a
`required` array:

- `nameAr`, `nameEn`, `phoneNumber`, `address`, `iconUrl`
- `descriptionAr`, `descriptionEn`, `mainCategoryId`
- `openTime`, `closeTime`, `priceLevel`
- `deliveryTimeMinutes`, `deliveryFee`, `latitude`, `longitude`
- `isActive`, `ownerId`, `ownerEmail`, `ownerPassword`
- `cuisineIds`, `imageUrls`

The sensitive properties are nullable in the OpenAPI schema, but Swagger does
not document that an Owner may edit ownership, credentials, or platform
activation. The frontend therefore never reads, stores, logs, displays, or
serializes `ownerPassword`, and never serializes `ownerId`, `ownerEmail`, or
`isActive`. A guarded serializer and request service accept only the
non-sensitive editable subset and require a backend-verified owner/store scope.
No Store edit form calls it because the required scope cannot currently be
obtained safely.

`POST /api/Store/UploadIcon` is blocked. Swagger documents the `File` multipart
field but gives no response schema, file type limit, or file size limit. A
shared multipart helper exists at `src/lib/api/upload.ts`; it appends exactly
`File`, delegates Bearer handling to the centralized client, and treats only a
confirmed successful HTTP/envelope result as completion. The frontend cannot
safely obtain or apply an icon URL without inventing a response contract.

Phase 2 also reviewed `PUT /api/Store/SetActive/{id}` and
`PUT /api/Store/Update/{id}`. The Store service can build the exact SetActive
path/body and safely serialize the non-sensitive Update subset for future use,
but it sends neither operation: no verified Owner-to-Store mapping is
available, and the inspected source restricts Store Update, UploadIcon, and
SetActive to `Admin,SuperAdmin`. Deployed Swagger field presence is not treated
as Owner permission. `POST /api/Store/Create` remains outside the approved
operations and is not exposed.

## Menu-category contract findings

The Swagger request schemas are:

- `GET /api/MenuCategory/GetAll`: optional `storeId` UUID and `onlyActive` boolean
- `POST /api/MenuCategory/Create` and `PUT /api/MenuCategory/Update/{id}`:
  `storeId`, `nameAr`, `nameEn`, `imageUrl`, `displayOrder`, `isActive`
- `PUT /api/MenuCategory/SetActive/{id}`: `{ isActive }`

The brief supplies the category item fields `id`, `storeId`, `nameAr`, `nameEn`,
`imageUrl`, `displayOrder`, `isActive`, and `itemsCount`. Swagger gives no
response schemas for these operations and no owner-permission annotation.

The request/response parsing and serialization code is covered by mocked tests,
but no menu-category operation is wired to the UI or allowed to run without an
`OwnerStoreScope`. That scope can only be made from a documented,
server-authoritative owner-to-store mapping whose owner ID matches the
authenticated session. No such endpoint is present in the reviewed Swagger.
A missing, malformed, or unverified scope fails before `fetch`; a returned
category for a different store is rejected rather than rendered. The backend
must independently enforce ownership for every read and write.

`POST /api/MenuCategory/UploadIcon` is blocked for the same missing response
schema and undocumented file constraints. Its guarded adapter reuses
`src/lib/api/upload.ts` for a future verified scope, but the UI does not call
it or fabricate the returned image URL. The adapter preserves the existing
icon because it returns no response URL and only a confirmed upload result can
be considered successful.

## Backend source cross-check

The public source candidate has additional implementation evidence that is not
present in the deployed Swagger:

- `Store.OwnerId` is nullable `Guid?`, foreign-keyed to `AspNetUsers.Id`, with
  `WithMany()` and no unique owner index. The source schema therefore permits
  one owner to have multiple stores and permits an unowned store.
- `Store/Create` is restricted to `Admin,SuperAdmin` in that source, but its
  handler creates only a Store and does not create an Identity account or set
  `OwnerId`.
- `Store/Update` and `Store/UploadIcon` are also restricted to
  `Admin,SuperAdmin`; `Store/SetActive` has the same restriction. They are not
  Owner operations in the source implementation.
- Menu mutation handlers accept the `Owner` role and compare the resource's
  `OwnerId` with the authenticated `NameIdentifier` claim. This is useful
  server-side protection, but it does not provide a current-owner Store query.

These findings reinforce the frontend block. They do not prove the deployed
application uses that exact revision until deployment provenance is confirmed.

## Contract discrepancy requiring backend clarification

Swagger's `UserRole` component is a numeric enum `[0, 1, 2]`, while the supplied
login/profile examples use the string `Owner`. The login/profile implementation
follows the explicit Owner-only examples and rejects numeric or non-Owner role
values. The backend should publish the actual serialized role contract before
role-dependent work expands.

Swagger also omits response schemas for every endpoint in this phase. The
brief-provided examples are therefore treated as the minimum shapes for
profile, main-category, and menu-category parsing; they are not a substitute
for a generated response schema.

## Explicitly not exposed in this phase

- Store creation and platform-wide Store management
- Store activation/approval changes (the reviewed SetActive operation is
  unavailable until Owner permission and a verified scope are established)
- MainCategory creation, editing, activation, or deletion
- Cuisine administration
- Account registration, user listing, archiving, or unarchiving
- Customer Cart, Address, Favorites, Orders, and Reports
- Menu items and any other endpoint not supplied as a phase contract

Routes for the previous platform-wide/demo management screens were removed from
the Owner navigation and route table. The remaining overview visuals are still
labelled preview data; they are not presented as API results.

## Live verification and test data

No authorized account was supplied and no authenticated production request was
made. Automated tests use mocked HTTP responses only. Test UUIDs and tokens are
synthetic; no real credentials or tokens are committed.
