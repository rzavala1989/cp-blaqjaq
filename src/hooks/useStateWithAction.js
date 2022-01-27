import { useReducer } from 'react';

export default function useStateWithAction(actionHandlers, initialState) {
  const reducer = (state, { type, payload }) =>
    actionHandlers[type](state)(payload);

  //use Reducer goes here
  const [state, dispatch] = useReducer(reducer, initialState);

  //actions go here
  const actions = Object.keys(actionHandlers).reduce(
    (acc, type) => ({
      ...acc,
      [type]: (payload) => dispatch({ type, payload }),
    }),
    {}
  );

  return [state, actions];
}
