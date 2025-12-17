// Smooth scroll utility
export const smoothScrollTo = (element, offset = 0) => {
    if (typeof window === 'undefined') return;
    
    const targetElement = typeof element === 'string' 
        ? document.querySelector(element) 
        : element;
    
    if (!targetElement) return;
    
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
};

export const scrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

