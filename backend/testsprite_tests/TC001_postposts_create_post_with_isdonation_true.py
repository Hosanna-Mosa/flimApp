import requests
import time

BASE_URL = "http://localhost:8777"
TIMEOUT = 30

def test_create_post_with_isdonation_true():
    # Step 1: Register a unique test user
    timestamp = int(time.time())
    register_url = f"{BASE_URL}/auth/register"
    test_user = {
        "name": "Test User",
        "username": f"testuser_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "phone": f"999999{timestamp%10000:04d}",
        "password": "TestPass123!",
        "roles": ["member"],
        "industries": ["film"]
    }
    try:
        # Register user
        reg_resp = requests.post(register_url, json=test_user, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
        reg_data = reg_resp.json()
        assert reg_data.get("success") is True
        access_token = reg_data["data"]["accessToken"]
        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: Create a post with isDonation = true and valid type
        post_url = f"{BASE_URL}/posts"
        post_payload = {
            "type": "text",
            "caption": "Support my independent film project!",
            "isDonation": True,
            "roles": ["member"],
            "industries": ["film"]
        }
        post_resp = requests.post(post_url, json=post_payload, headers=headers, timeout=TIMEOUT)
        assert post_resp.status_code == 201, f"Post creation failed: {post_resp.text}"
        post_data = post_resp.json()
        assert post_data.get("success") is True
        created_post = post_data.get("data")
        assert created_post is not None
        post_id = created_post.get("id") or created_post.get("_id")
        assert post_id is not None

        # Step 3: Verify post is excluded from main feed
        feed_url = f"{BASE_URL}/api/feed"
        feed_resp = requests.get(feed_url, headers=headers, timeout=TIMEOUT)
        assert feed_resp.status_code == 200, f"Feed fetch failed: {feed_resp.text}"
        feed_data = feed_resp.json()
        assert feed_data.get("success") is True
        posts = feed_data.get("data", [])
        post_ids_in_feed = {p.get("id") or p.get("_id") for p in posts}
        assert post_id not in post_ids_in_feed, "Donation post should be excluded from main feed"

        # Step 4: Verify post is included in donations list
        donations_url = f"{BASE_URL}/posts/donations"
        donations_resp = requests.get(donations_url, headers=headers, timeout=TIMEOUT)
        assert donations_resp.status_code == 200, f"Donations fetch failed: {donations_resp.text}"
        donations_data = donations_resp.json()
        assert donations_data.get("success") is True
        donation_posts = donations_data.get("data", [])
        donation_post_ids = {p.get("id") or p.get("_id") for p in donation_posts}
        assert post_id in donation_post_ids, "Donation post missing in donations list"

    finally:
        # Cleanup: Delete the created post and user if possible
        # Delete post
        if 'post_id' in locals():
            try:
                del_resp = requests.delete(f"{BASE_URL}/posts/{post_id}", headers=headers, timeout=TIMEOUT)
                # 200 expected, but ignore errors during cleanup
            except Exception:
                pass
        # Delete user account
        if 'headers' in locals():
            try:
                requests.delete(f"{BASE_URL}/users/me", headers=headers, timeout=TIMEOUT)
            except Exception:
                pass

test_create_post_with_isdonation_true()
