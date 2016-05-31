# react-redux-transaction (alpha)

As of now, this is just an experiment. React helpers for redux-transaction.

##### Post.js

```js
import { model } from 'react-redux-transaction';
import { fetchPost } from '../actions';

const Post = ({ id, title, transaction: { isPending, error } }) => (
  <div>
    <h1>
      {isPending
        ? 'Loading...'
        : error
          ? 'ERROR: ' + error.message
          : title
      }
    </h1>
  </div>
);

export default model({
  mapStateToActionProps: (state, props) => ({ id: props.params.id }),
  mapActionPropsToAction: ({ id }) => fetchPost(id),
  mapStateToProps: (state, props) => ({ ...state.postsById[props.params.id] })
})(Post);


```

##### actions.js

```js
import { pend, fulfill, reject, cancel } from 'redux-transaction';

// Example using redux-thunk or similar

export const fetchPost = id =>
  dispatch => {
    // the action POJO is used as a handle to fulfill/reject/cancel that
    // transaction later
  	const pendingAction = dispatch(pend({ type: 'FETCH_POST', payload: { id } }));

    // fake AJAX
  	setTimeout(() => {
  	  // dispatch(fulfill(pendingAction, { id, title: 'Example post' }));
  	  dispatch(reject(pendingAction, { message: 'THE SERVER HATES YOU' }));
  	}, 2000);
	
	// return the pending action so that the @model() decorator
	// can automatically cancel() it on props change/unmount
  	return pendingAction;
  };
```

##### rootReducer.js

```js
const post = (state = { id: null, title: null }, action) => {
  switch (action.type) {
    case 'FETCH_POST':
    case 'FETCH_POST_FULFILLED':
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
};

const postsById = (state = {}, action) => {
  switch (action.type) {
    case 'FETCH_POST':
    case 'FETCH_POST_FULFILLED':
      const { id } = action.payload;

      return {
        ...state,
        [id]: post(state[id], action)
      };

    default:
      return state;
  }
};

export default combineReducers({
  postsById
});

```

##### index.js

```js
import thunk from 'redux-thunk';
import { reducerEnhancer } from 'redux-transaction';

const store = createStore(
  reducerEnhancer(rootReducer),
  applyMiddleware(thunk)
);

// etc...
```