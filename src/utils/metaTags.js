export const updateMetaTags = (title, description) => {
  document.title = `${title} | ChronoPay`;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
}; 
