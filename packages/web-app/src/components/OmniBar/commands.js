export const processRoutes = (data = [], navigate) => {
  if (Array.isArray(data)) {
    return data.map((route) => {
      return {
        id: `${route.title}-route`,
        category: 'Navigate',
        name: route.name,
        command: () => {
          navigate(route.path);
        }
      }
    });
  }
  throw new Error('Action list should be an name should be an array');
};

export const removeCommandsByCategory = (categoryName, actionList = []) => {
  if (Array.isArray(actionList)) {
    return actionList.filter(value => value.category !== categoryName);
  }
  throw new Error('Action list should be an name should be an array');
};

export const reProcessCommands = (commands, payload) => {
  const { routes, type, extras } = payload;
  switch (type) {
    case 'Navigate': {
      const newState = removeCommandsByCategory(type, commands);
      const updatedRouteList = processRoutes(routes, extras.navigate);
      return [...newState, ...updatedRouteList]
    }
    default: {
      throw new Error('Invalid action');
    }
  }
};
