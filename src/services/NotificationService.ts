export class NotificationService {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static async notify(title: string, options?: any) {
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      return new Notification(title, {
        icon: '/vite.svg', // Default icon
        ...options
      });
    }
  }

  static async notifyAdmin(order: { customer_name: string; product_name: string }) {
    return this.notify('New Order Received! 🛍️', {
      body: `${order.customer_name} just ordered ${order.product_name}`,
      tag: 'new-order',
      renotify: true
    });
  }

  static async notifyCustomer(status: string, productName: string) {
    const statusMessages: Record<string, string> = {
      completed: `Your order for ${productName} has been completed! ✅`,
      deleted: `Your order for ${productName} has been cancelled. ❌`,
      pending: `Your order for ${productName} is now pending. ⏳`
    };

    return this.notify('Order Update 📦', {
      body: statusMessages[status] || `Your order for ${productName} status is now: ${status}`,
      tag: `order-update-${productName}`,
      renotify: true
    });
  }
}
