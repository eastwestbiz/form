/**
 * Lazy Load Utility Module
 * Handles lazy loading of images, iframes, and scripts
 * with performance optimizations and error handling
 */

// =============================================
// SECTION 1: CONSTANTS AND CONFIGURATION
// =============================================
const DEFAULT_CONFIG = {
  // Image loading
  imageSelector: 'img[data-src]',
  imageThreshold: 0.1,
  imageRootMargin: '200px',
  
  // Iframe loading
  iframeSelector: 'iframe[data-src]',
  iframeThreshold: 0.01,
  iframeRootMargin: '400px',
  
  // Script loading
  scriptSelector: 'script[data-src]',
  scriptThreshold: 0,
  scriptRootMargin: '500px',
  
  // Error handling
  maxRetryAttempts: 2,
  retryDelay: 1000,
  
  // Placeholders
  useImagePlaceholders: true,
  placeholderClass: 'lazy-placeholder',
  
  // Debugging
  debug: false
};

// =============================================
// SECTION 2: CORE FUNCTIONALITY
// =============================================
class LazyLoader {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.observers = {};
    this.retryCounts = new WeakMap();
    
    this.init();
  }

  init() {
    // Initialize Intersection Observers for different types
    this.initImageObserver();
    this.initIframeObserver();
    this.initScriptObserver();
    
    // Start observing elements
    this.observeElements();
    
    // Handle dynamic content added later
    this.setupMutationObserver();
  }

  initImageObserver() {
    this.observers.images = new IntersectionObserver(
      this.handleImageIntersection.bind(this),
      {
        threshold: this.config.imageThreshold,
        rootMargin: this.config.imageRootMargin
      }
    );
  }

  initIframeObserver() {
    this.observers.iframes = new IntersectionObserver(
      this.handleIframeIntersection.bind(this),
      {
        threshold: this.config.iframeThreshold,
        rootMargin: this.config.iframeRootMargin
      }
    );
  }

  initScriptObserver() {
    this.observers.scripts = new IntersectionObserver(
      this.handleScriptIntersection.bind(this),
      {
        threshold: this.config.scriptThreshold,
        rootMargin: this.config.scriptRootMargin
      }
    );
  }

  observeElements() {
    // Observe images
    document.querySelectorAll(this.config.imageSelector).forEach(img => {
      this.observers.images.observe(img);
      if (this.config.useImagePlaceholders) {
        img.classList.add(this.config.placeholderClass);
      }
    });

    // Observe iframes
    document.querySelectorAll(this.config.iframeSelector).forEach(iframe => {
      this.observers.iframes.observe(iframe);
    });

    // Observe scripts
    document.querySelectorAll(this.config.scriptSelector).forEach(script => {
      this.observers.scripts.observe(script);
    });
  }

  setupMutationObserver() {
    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for new lazy elements
            if (node.matches(this.config.imageSelector)) {
              this.observers.images.observe(node);
            } else if (node.matches(this.config.iframeSelector)) {
              this.observers.iframes.observe(node);
            } else if (node.matches(this.config.scriptSelector)) {
              this.observers.scripts.observe(node);
            }
            
            // Check children of added nodes
            node.querySelectorAll(this.config.imageSelector).forEach(img => {
              this.observers.images.observe(img);
            });
            node.querySelectorAll(this.config.iframeSelector).forEach(iframe => {
              this.observers.iframes.observe(iframe);
            });
            node.querySelectorAll(this.config.scriptSelector).forEach(script => {
              this.observers.scripts.observe(script);
            });
          }
        });
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // =============================================
  // SECTION 3: INTERSECTION HANDLERS
  // =============================================
  handleImageIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img)
          .then(() => {
            observer.unobserve(img);
            img.classList.add('lazy-loaded');
            img.classList.remove(this.config.placeholderClass);
          })
          .catch(error => {
            this.handleLoadError(img, error, 'image');
          });
      }
    });
  }

  handleIframeIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const iframe = entry.target;
        this.loadIframe(iframe)
          .then(() => {
            observer.unobserve(iframe);
            iframe.classList.add('lazy-loaded');
          })
          .catch(error => {
            this.handleLoadError(iframe, error, 'iframe');
          });
      }
    });
  }

  handleScriptIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const script = entry.target;
        this.loadScript(script)
          .then(() => {
            observer.unobserve(script);
            script.classList.add('lazy-loaded');
          })
          .catch(error => {
            this.handleLoadError(script, error, 'script');
          });
      }
    });
  }

  // =============================================
  // SECTION 4: LOADING FUNCTIONS
  // =============================================
  loadImage(img) {
    return new Promise((resolve, reject) => {
      if (!img.dataset.src) {
        reject(new Error('No data-src attribute found'));
        return;
      }

      const imageLoader = new Image();
      
      imageLoader.onload = () => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        if (img.dataset.sizes) img.sizes = img.dataset.sizes;
        resolve();
      };
      
      imageLoader.onerror = () => {
        reject(new Error(`Failed to load image: ${img.dataset.src}`));
      };
      
      imageLoader.src = img.dataset.src;
    });
  }

  loadIframe(iframe) {
    return new Promise((resolve, reject) => {
      if (!iframe.dataset.src) {
        reject(new Error('No data-src attribute found'));
        return;
      }

      iframe.onload = () => resolve();
      iframe.onerror = () => reject(new Error(`Failed to load iframe: ${iframe.dataset.src}`));
      
      iframe.src = iframe.dataset.src;
    });
  }

  loadScript(script) {
    return new Promise((resolve, reject) => {
      if (!script.dataset.src) {
        reject(new Error('No data-src attribute found'));
        return;
      }

      const newScript = document.createElement('script');
      newScript.src = script.dataset.src;
      if (script.dataset.async) newScript.async = true;
      if (script.dataset.defer) newScript.defer = true;
      
      newScript.onload = () => {
        script.parentNode.replaceChild(newScript, script);
        resolve();
      };
      
      newScript.onerror = () => {
        reject(new Error(`Failed to load script: ${script.dataset.src}`));
      };
      
      document.body.appendChild(newScript);
    });
  }

  // =============================================
  // SECTION 5: ERROR HANDLING AND RETRY
  // =============================================
  handleLoadError(element, error, type) {
    const currentRetry = this.retryCounts.get(element) || 0;
    
    if (this.config.debug) {
      console.error(`LazyLoad ${type} error:`, error.message);
    }
    
    if (currentRetry < this.config.maxRetryAttempts) {
      // Retry after delay
      setTimeout(() => {
        this.retryCounts.set(element, currentRetry + 1);
        
        switch (type) {
          case 'image':
            this.loadImage(element).catch(e => this.handleLoadError(element, e, type));
            break;
          case 'iframe':
            this.loadIframe(element).catch(e => this.handleLoadError(element, e, type));
            break;
          case 'script':
            this.loadScript(element).catch(e => this.handleLoadError(element, e, type));
            break;
        }
      }, this.config.retryDelay);
    } else {
      // Max retries reached
      element.classList.add('lazy-error');
      if (this.config.debug) {
        console.error(`Max retries reached for ${type}:`, element);
      }
      
      // Dispatch custom event for error handling
      const event = new CustomEvent('lazyLoadError', {
        detail: { element, type, error }
      });
      document.dispatchEvent(event);
    }
  }

  // =============================================
  // SECTION 6: PUBLIC API
  // =============================================
  /**
   * Manually trigger loading of an element
   * @param {HTMLElement} element - The element to load
   */
  loadNow(element) {
    if (element.matches(this.config.imageSelector)) {
      this.loadImage(element).catch(error => this.handleLoadError(element, error, 'image'));
    } else if (element.matches(this.config.iframeSelector)) {
      this.loadIframe(element).catch(error => this.handleLoadError(element, error, 'iframe'));
    } else if (element.matches(this.config.scriptSelector)) {
      this.loadScript(element).catch(error => this.handleLoadError(element, error, 'script'));
    }
  }

  /**
   * Disconnect all observers and clean up
   */
  destroy() {
    Object.values(this.observers).forEach(observer => observer.disconnect());
    if (this.mutationObserver) this.mutationObserver.disconnect();
  }
}

// =============================================
// SECTION 7: INITIALIZATION AND EXPORT
// =============================================

// Initialize with default configuration
const lazyLoader = new LazyLoader();

// Export for module usage
export default lazyLoader;

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined') {
  window.lazyLoader = lazyLoader;
  
  // Also expose a simple function for basic usage
  window.initLazyLoad = function(config) {
    return new LazyLoader(config);
  };
}