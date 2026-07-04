// This service worker is required for Expo Push Notifications to work on the web.
// It handles background push events.

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'New Notification';
    const options = {
        body: data.message || data.body || '',
        icon: '/favicon.png', // Update this if you have a specific notification icon
        data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    // Handle notification click - usually open the app
    event.waitUntil(
        clients.openWindow('/')
    );
});
