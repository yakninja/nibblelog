# Nibblelog Server Tests

## Running Tests

### Install test dependencies

```bash
pip install -r requirements-dev.txt
```

### Run all tests

```bash
pytest -v
```

### Run with coverage

```bash
pytest --cov=app --cov-report=html
```

### Run specific test file

```bash
pytest tests/test_auth.py -v
```

### Run specific test

```bash
pytest tests/test_auth.py::test_login_endpoint -v
```

## Test Structure

- `tests/conftest.py` - Shared fixtures (client, auth_headers)
- `tests/test_auth.py` - Authentication and JWT tests (10 tests)
- `tests/test_sync.py` - Sync endpoint tests (5 integration tests, skipped by default)

## Note on Integration Tests

The sync tests in `test_sync.py` are marked as skipped because they require a running database. To run integration tests:

1. Start the Postgres database: `docker compose up -d`
2. Run: `pytest -v -m "not skip"`

Or remove the `@pytest.mark.skip` decorators to run them.

## Test Coverage

Current unit tests cover:

- ✅ User authentication
- ✅ JWT token creation and verification
- ✅ Login endpoint
- ✅ Health check endpoint
- ⏭️ Sync push/pull (integration tests skipped)
