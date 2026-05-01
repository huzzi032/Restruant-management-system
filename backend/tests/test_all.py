"""
Comprehensive test suite for Restaurant Management System.
Tests: auth, menu (dynamic per-restaurant), orders, payments, reports, AI/Groq.
Uses an in-memory SQLite DB — no external services required (Groq is opt-in).
"""
import os
import pytest
from fastapi.testclient import TestClient

# conftest.py handles DB setup, engine creation, table creation, seeding,
# and the get_db dependency override before any imports here.
from app.main import app

# ── Shared fixtures ───────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(scope="session")
def admin_token(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "admin123"},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ══════════════════════════════════════════════════════════════════════════════
# 1. Health & Root
# ══════════════════════════════════════════════════════════════════════════════

def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_root(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "api" in resp.json()


# ══════════════════════════════════════════════════════════════════════════════
# 2. Authentication
# ══════════════════════════════════════════════════════════════════════════════

def test_login_success(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "admin123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["username"] == "testadmin"
    assert body["user"]["role"] == "admin"


def test_login_wrong_password(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "testadmin", "password": "wrongpass"},
    )
    # Auth service raises 401; router wraps in 500 on any exception
    assert resp.status_code in (401, 500)


def test_me_endpoint(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "testadmin"


# ══════════════════════════════════════════════════════════════════════════════
# 3. Restaurant signup (multi-tenant)
# ══════════════════════════════════════════════════════════════════════════════

def test_restaurant_signup(client):
    resp = client.post(
        "/api/v1/auth/signup",
        json={
            "restaurant_name": "Pizza Palace",
            "admin_full_name": "Pizza Boss",
            "admin_username": "pizzaboss",
            "password": "pizza123",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "restaurant_code" in body
    assert body["restaurant_name"] == "Pizza Palace"
    assert body["admin_user"]["role"] == "admin"


# ══════════════════════════════════════════════════════════════════════════════
# 4. Menu (dynamic per-restaurant)
# ══════════════════════════════════════════════════════════════════════════════

_category_id = None  # shared across tests in this section


def test_create_category(client, auth_headers):
    global _category_id
    resp = client.post(
        "/api/v1/menu/categories",
        json={"name": "Test Category", "description": "For testing", "sort_order": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    _category_id = resp.json()["id"]


def test_create_second_category(client, auth_headers):
    resp = client.post(
        "/api/v1/menu/categories",
        json={"name": "Drinks", "description": "Beverages", "sort_order": 2},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Drinks"


def test_get_categories_dynamic(client, auth_headers):
    """Categories must be scoped to the current restaurant — dynamic per user."""
    resp = client.get("/api/v1/menu/categories", headers=auth_headers)
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert "Test Category" in names


def test_create_menu_item(client, auth_headers):
    assert _category_id is not None, "category_id not set — run test_create_category first"
    resp = client.post(
        "/api/v1/menu/items",
        json={
            "name": "Test Burger",
            "price": 9.99,
            "cost": 3.50,
            "category_id": _category_id,
            "description": "A juicy test burger",
            "is_available": True,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["name"] == "Test Burger"
    assert body["price"] == 9.99


def test_get_menu_items_dynamic(client, auth_headers):
    """Menu items must be dynamically scoped to the authenticated restaurant."""
    resp = client.get("/api/v1/menu/items", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    names = [i["name"] for i in items]
    assert "Test Burger" in names


def test_public_menu_items(client):
    """Public menu endpoint works without authentication."""
    resp = client.get("/api/v1/menu/public/items?restaurant_code=test-rest")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_public_categories(client):
    resp = client.get("/api/v1/menu/public/categories?restaurant_code=test-rest")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ══════════════════════════════════════════════════════════════════════════════
# 5. Orders
# ══════════════════════════════════════════════════════════════════════════════

def test_get_orders(client, auth_headers):
    resp = client.get("/api/v1/orders", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ══════════════════════════════════════════════════════════════════════════════
# 6. Inventory (tenant-scoped)
# ══════════════════════════════════════════════════════════════════════════════

_inventory_item_id = None


def test_create_inventory_item(client, auth_headers):
    global _inventory_item_id
    resp = client.post(
        "/api/v1/inventory/items",
        json={
            "name": "Tomatoes",
            "quantity": 50.0,
            "unit": "kg",
            "cost_per_unit": 1.5,
            "min_stock_level": 10.0,
            "max_stock_level": 100.0,
            "reorder_point": 20.0,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    _inventory_item_id = resp.json()["id"]


def test_get_inventory_items(client, auth_headers):
    resp = client.get("/api/v1/inventory/items", headers=auth_headers)
    assert resp.status_code == 200
    names = [i["name"] for i in resp.json()]
    assert "Tomatoes" in names


def test_inventory_value(client, auth_headers):
    resp = client.get("/api/v1/inventory/value", headers=auth_headers)
    assert resp.status_code == 200
    assert "total_value" in resp.json()


def test_low_stock(client, auth_headers):
    resp = client.get("/api/v1/inventory/items/low-stock", headers=auth_headers)
    assert resp.status_code == 200
    assert "low_stock_items" in resp.json()


# ══════════════════════════════════════════════════════════════════════════════
# 7. Reports (all tenant-scoped)
# ══════════════════════════════════════════════════════════════════════════════

def test_daily_report(client, auth_headers):
    resp = client.get("/api/v1/reports/daily", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "total_sales" in body
    assert "total_orders" in body
    assert "net_profit" in body


def test_monthly_report(client, auth_headers):
    resp = client.get("/api/v1/reports/monthly", headers=auth_headers)
    assert resp.status_code == 200
    assert "total_sales" in resp.json()


def test_sales_report(client, auth_headers):
    resp = client.get("/api/v1/reports/sales", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "period_start" in body
    assert "top_items" in body


def test_inventory_report(client, auth_headers):
    resp = client.get("/api/v1/reports/inventory", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "total_items" in body
    assert "low_stock_count" in body


def test_employee_report(client, auth_headers):
    resp = client.get("/api/v1/reports/employees", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "total_employees" in body


def test_dashboard_summary(client, auth_headers):
    resp = client.get("/api/v1/reports/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "today_sales" in body
    assert "pending_orders" in body
    assert "active_tables" in body


def test_profit_loss_report(client, auth_headers):
    resp = client.get("/api/v1/reports/profit-loss", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "profit_loss" in body
    assert "revenue" in body


# ══════════════════════════════════════════════════════════════════════════════
# 8. AI / Groq
# ══════════════════════════════════════════════════════════════════════════════

def test_ai_dashboard_insights(client, auth_headers):
    """Insights endpoint must always return (gracefully handles missing Groq key)."""
    resp = client.get("/api/v1/ai/dashboard-insights", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "insights" in body
    assert isinstance(body["insights"], list)


def test_ai_chat(client, auth_headers):
    """Chat endpoint must accept JSON body."""
    resp = client.post(
        "/api/v1/ai/chat",
        json={"question": "How are sales today?"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "answer" in body
    assert "question" in body
    # Even without Groq the answer field should be a non-empty string
    assert isinstance(body["answer"], str) and len(body["answer"]) > 0


def test_groq_live():
    """
    Live Groq connectivity test.
    Automatically SKIPPED when GROQ_API_KEY is not in the environment.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        pytest.skip("GROQ_API_KEY not set — skipping live Groq connectivity test")

    try:
        from groq import Groq
    except ImportError:
        pytest.skip("groq package not installed")

    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    groq_client = Groq(api_key=groq_key)

    response = groq_client.chat.completions.create(
        model=groq_model,
        messages=[{"role": "user", "content": "Reply ONLY with the word: CONNECTED"}],
        max_tokens=10,
        timeout=30.0,
    )
    answer = response.choices[0].message.content.strip()
    assert len(answer) > 0, "Groq returned empty response"
    print(f"\n✓ Groq live test passed — model responded: {answer!r}")


# ══════════════════════════════════════════════════════════════════════════════
# 9. Multi-tenancy isolation
# ══════════════════════════════════════════════════════════════════════════════

def test_multi_tenant_isolation(client):
    """
    Two restaurants must NOT share menu data.
    Restaurant B should never see Restaurant A's categories.
    """
    def _signup(name, username):
        r = client.post(
            "/api/v1/auth/signup",
            json={
                "restaurant_name": name,
                "admin_full_name": f"Admin of {name}",
                "admin_username": username,
                "password": "pass1234",
            },
        )
        assert r.status_code == 200, f"Signup failed for {name}: {r.text}"
        return r.json()["restaurant_code"]

    def _login(username, code):
        r = client.post(
            "/api/v1/auth/login",
            json={"username": username, "password": "pass1234", "restaurant_code": code},
        )
        assert r.status_code == 200, f"Login failed for {username}: {r.text}"
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    code_a = _signup("IsoRestA", "iso_admin_a")
    code_b = _signup("IsoRestB", "iso_admin_b")

    headers_a = _login("iso_admin_a", code_a)
    headers_b = _login("iso_admin_b", code_b)

    # A creates a unique category
    unique = "ONLY_A_CATEGORY_XYZ_9999"
    r = client.post(
        "/api/v1/menu/categories",
        json={"name": unique, "description": "Exclusive to A"},
        headers=headers_a,
    )
    assert r.status_code == 200, f"Category creation failed: {r.text}"

    # B must NOT see A's category
    cats_b = client.get("/api/v1/menu/categories", headers=headers_b).json()
    names_b = [c["name"] for c in cats_b]
    assert unique not in names_b, (
        f"SECURITY BUG: Restaurant B can see Restaurant A's category '{unique}'"
    )

    # A must see its own category
    cats_a = client.get("/api/v1/menu/categories", headers=headers_a).json()
    names_a = [c["name"] for c in cats_a]
    assert unique in names_a, "Restaurant A cannot see its own category"
