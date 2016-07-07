import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { getTransactionId, cancel, BEGIN, COMMIT, ROLLBACK } from 'redux-transaction';

const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
);

export const transactionMetaShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf([BEGIN, COMMIT, ROLLBACK]),
});

export const metaShape = PropTypes.shape({
  transaction: transactionMetaShape.isRequired
});

export const actionShape = PropTypes.shape({
  type: PropTypes.string.isRequired,
  meta: metaShape.isRequired
});

const model = hooks =>
  ComposedComponent => {
    const ConnectedComponent = connect(
        hooks.mapStateToProps,
        hooks.mapDispatchToProps,
        hooks.mergeProps,
        hooks.options
      )(ComposedComponent);

    @connect(({ transactions }, { action, retry }) => ({
      action,
      transaction: transactions[getTransactionId(action)]
    }))
    class Transaction extends Component {
      static contextTypes = {
        store: PropTypes.object.isRequired
      };

      static propTypes = {
        transaction: transactionMetaShape.isRequired,
        action: actionShape.isRequired
      };

      render() {
        // This will intentionally exclude retry/action
        const { retry, action, ...props } = this.props; //eslint-disable-line no-unused-vars
        return (
          <ConnectedComponent {...props} />
        );
      }
    }

    @connect(hooks.mapStateToActionProps)
    class Action extends Component {
      static contextTypes = {
        store: PropTypes.object.isRequired
      };

      state = {
        action: null
      };

      cancelPendingAction() {
        const { action } = this.state;
        const { getState, dispatch } = this.context.store;

        if (action) {
          const { transactions } = getState();
          const previousTransaction = transactions[getTransactionId(action)];

          if (previousTransaction && previousTransaction.isPending) {
            dispatch(cancel(action));
          }
        }
      }

      update = (nextProps) => {
        const { dispatch } = this.context.store;

        this.cancelPendingAction();
        const action = hooks.mapActionPropsToAction(nextProps);
        // the action might be async (e.g. thunk) so we need to capture the
        // result of dispatch to get the *real* action
        this.setState({
          action: dispatch(action) || action
        });
      }

      componentWillMount() {
        this.update(this.props);
      }

      componentWillReceiveProps(nextProps) {
        this.update(nextProps);
      }

      componentWillUnmount() {
        this.cancelPendingAction();
      }

      render() {
        return (
          <Transaction {...this.props} action={this.state.action} retry={this.update} />
        );
      }
    }

    Action.propTypes = hooks.propTypes;
    Action.displayName = `Model(${getDisplayName(ComposedComponent)})`;

    return Action;
  };

export default model;
