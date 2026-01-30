/**
 * Navigation Utility
 * 
 * Provides a way to navigate programmatically outside React components.
 * Useful for interceptors, utilities, and services that need to redirect.
 * 
 * This creates a navigation service that can be used anywhere in the app,
 * including in axios interceptors and other non-React contexts.
 */

type NavigationCallback = (path: string) => void;

class NavigationService {
  private navigator: NavigationCallback | null = null;

  /**
   * Register the navigation function (should be called from App component)
   * @param navigate - React Router's navigate function
   */
  register(navigate: NavigationCallback): void {
    this.navigator = navigate;
  }

  /**
   * Navigate to a path
   * @param path - Path to navigate to
   * @param replace - Whether to replace current history entry (default: false)
   */
  navigate(path: string, replace: boolean = false): void {
    if (this.navigator) {
      this.navigator(path);
    } else {
      // Fallback to window.location if navigator not registered
      // This is safe for auth redirects as it ensures a full page reload
      if (replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }
    }
  }

  /**
   * Navigate and replace current history entry
   * @param path - Path to navigate to
   */
  replace(path: string): void {
    this.navigate(path, true);
  }

  /**
   * Check if navigator is registered
   */
  isRegistered(): boolean {
    return this.navigator !== null;
  }
}

export const navigationService = new NavigationService();
