// similar products
const similarItems = (currentItem: any, allItems: any[]) => {
  let categories: string[] = [];
  let tags: string[] = [];

  // set categories
  if (Array.isArray(currentItem?.data?.categories) && currentItem.data.categories.length > 0) {
    categories = currentItem.data.categories;
  }

  // set tags
  if (Array.isArray(currentItem?.data?.tags) && currentItem.data.tags.length > 0) {
    tags = currentItem.data.tags;
  }

  // filter by categories
  const filterByCategories = allItems.filter((item: any) =>
    categories.find((category) => Array.isArray(item?.data?.categories) && item.data.categories.includes(category)),
  );

  // filter by tags
  const filterByTags = allItems.filter((item: any) =>
    tags.find((tag) => Array.isArray(item?.data?.tags) && item.data.tags.includes(tag)),
  );

  // merged after filter
  const mergedItems = [...new Set([...filterByCategories, ...filterByTags])];

  // filter by slug
  const filterBySlug = mergedItems.filter(
    (product) => product.id !== currentItem.id,
  );

  return filterBySlug;
};

export default similarItems;
