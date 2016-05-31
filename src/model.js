import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { getTransactionId, cancel, BEGIN, COMMIT, ROLLBACK } from 'redux-transaction';

const getDisplayName = Component => (
  Component.displayName || Component.name || 'Component'
);

const typeCheckError = (propName, componentName) => {
  return new Error(`Required prop \`${propName}\` was not specified in \`${componentName}\``);
};

const transactionsTypeCheck = (isRequired, props, propName, componentName) => {
  const transactions = props[propName];
  const error = typeCheckError.bind(null, propName, componentName);

  for (const key in transactions) {
    if (!key.match(/[0-9]+/)) {
      return error();
    }
    // TODO: the rest of the validation
  }
};

export const transactionsShape = transactionsTypeCheck.bind(null, false);
transactionsShape.isRequired = transactionsTypeCheck.bind(null, true);

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
      hooks.mapDispatchToProps
    )(ComposedComponent);

    @connect(({ transactions }) => ({ transactions }))
    class Transaction extends Component {
      static contextTypes = {
        store: PropTypes.object.isRequired
      };

      static propTypes = {
        transactions: transactionsShape.isRequired,
        action: actionShape.isRequired
      };

      render() {
        // This will intentionally exclude action/transactions
        const { action, transactions, ...props } = this.props;
        return (
          <ConnectedComponent
            {...props}
            transaction={transactions[getTransactionId(action)]}
          />
        );
      }
    }

    @connect(hooks.mapStateToActionProps)
    class Action extends Component {
      static contextTypes = {
        store: PropTypes.object.isRequired
      };

      update(nextProps) {
        const { getState, dispatch } = this.context.store;

        if (this.action) {
          const { transactions } = getState();
          const previousTransaction = transactions[getTransactionId(this.action)];

          if (previousTransaction && previousTransaction.isPending) {
            dispatch(cancel(this.action));
          }
        }

        this.action = hooks.mapActionPropsToAction(nextProps);
        dispatch(this.action);
      }

      componentWillMount() {
        this.update(this.props);
      }

      componentWillReceiveProps(nextProps) {
        this.update(nextProps);
      }

      componentWillUnmount() {

      }

      render() {
        return (
          <Transaction {...this.props} action={this.action}/>
        );
      }
    }

    Action.propTypes = hooks.propTypes;
    Action.displayName = `Model(${getDisplayName(ComposedComponent)})`;

    return Action;
  };

export default model;
