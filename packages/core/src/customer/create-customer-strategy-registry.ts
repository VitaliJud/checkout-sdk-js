import { createFormPoster } from '@bigcommerce/form-poster';
import { RequestSender } from '@bigcommerce/request-sender';
import { getScriptLoader } from '@bigcommerce/script-loader';

import { CheckoutActionCreator, CheckoutRequestSender, CheckoutStore } from '../checkout';
import { Registry } from '../common/registry';
import { ConfigActionCreator, ConfigRequestSender } from '../config';
import { FormFieldsActionCreator, FormFieldsRequestSender } from '../form';
import { PaymentMethodActionCreator, PaymentMethodRequestSender } from '../payment';
import { createPaymentIntegrationService } from '../payment-integration';
import { createAmazonPayV2PaymentProcessor } from '../payment/strategies/amazon-pay-v2';
import {
    createBraintreeVisaCheckoutPaymentProcessor,
    VisaCheckoutScriptLoader,
} from '../payment/strategies/braintree';
import { ChasePayScriptLoader } from '../payment/strategies/chasepay';
import {
    createGooglePayPaymentProcessor,
    GooglePayAdyenV2Initializer,
    GooglePayAdyenV3Initializer,
    GooglePayAuthorizeNetInitializer,
    GooglePayBNZInitializer,
    GooglePayCheckoutcomInitializer,
    GooglePayCybersourceV2Initializer,
    GooglePayOrbitalInitializer,
    GooglePayStripeInitializer,
    GooglePayStripeUPEInitializer,
    GooglePayWorldpayAccessInitializer,
} from '../payment/strategies/googlepay';
import { MasterpassScriptLoader } from '../payment/strategies/masterpass';
import { RemoteCheckoutActionCreator, RemoteCheckoutRequestSender } from '../remote-checkout';
import {
    createSpamProtection,
    SpamProtectionActionCreator,
    SpamProtectionRequestSender,
} from '../spam-protection';

import createCustomerStrategyRegistryV2 from './create-customer-strategy-registry-v2';
import CustomerActionCreator from './customer-action-creator';
import CustomerRequestSender from './customer-request-sender';
import CustomerStrategyActionCreator from './customer-strategy-action-creator';
import { CustomerStrategy } from './strategies';
import { AmazonPayV2CustomerStrategy } from './strategies/amazon-pay-v2';
import { BraintreeVisaCheckoutCustomerStrategy } from './strategies/braintree';
import { ChasePayCustomerStrategy } from './strategies/chasepay';
import { DefaultCustomerStrategy } from './strategies/default';
import { GooglePayCustomerStrategy } from './strategies/googlepay';
import { MasterpassCustomerStrategy } from './strategies/masterpass';
import { SquareCustomerStrategy } from './strategies/square';

export default function createCustomerStrategyRegistry(
    store: CheckoutStore,
    requestSender: RequestSender,
    locale: string,
): Registry<CustomerStrategy> {
    const registry = new Registry<CustomerStrategy>();
    const scriptLoader = getScriptLoader();
    const checkoutRequestSender = new CheckoutRequestSender(requestSender);
    const checkoutActionCreator = new CheckoutActionCreator(
        checkoutRequestSender,
        new ConfigActionCreator(new ConfigRequestSender(requestSender)),
        new FormFieldsActionCreator(new FormFieldsRequestSender(requestSender)),
    );
    const formPoster = createFormPoster();
    const paymentMethodActionCreator = new PaymentMethodActionCreator(
        new PaymentMethodRequestSender(requestSender),
    );
    const remoteCheckoutRequestSender = new RemoteCheckoutRequestSender(requestSender);
    const remoteCheckoutActionCreator = new RemoteCheckoutActionCreator(
        remoteCheckoutRequestSender,
        checkoutActionCreator,
    );
    const spamProtectionActionCreator = new SpamProtectionActionCreator(
        createSpamProtection(scriptLoader),
        new SpamProtectionRequestSender(requestSender),
    );
    const customerActionCreator = new CustomerActionCreator(
        new CustomerRequestSender(requestSender),
        checkoutActionCreator,
        spamProtectionActionCreator,
    );

    const paymentIntegrationService = createPaymentIntegrationService(store);
    const customerRegistryV2 = createCustomerStrategyRegistryV2(paymentIntegrationService);

    registry.register(
        'googlepayadyenv2',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayAdyenV2Initializer()),
                formPoster,
            ),
    );

    registry.register(
        'googlepayadyenv3',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayAdyenV3Initializer()),
                formPoster,
            ),
    );

    registry.register(
        'amazonpay',
        () =>
            new AmazonPayV2CustomerStrategy(
                store,
                paymentMethodActionCreator,
                remoteCheckoutActionCreator,
                createAmazonPayV2PaymentProcessor(),
            ),
    );

    registry.register(
        'braintreevisacheckout',
        () =>
            new BraintreeVisaCheckoutCustomerStrategy(
                store,
                checkoutActionCreator,
                paymentMethodActionCreator,
                new CustomerStrategyActionCreator(registry, customerRegistryV2),
                remoteCheckoutActionCreator,
                createBraintreeVisaCheckoutPaymentProcessor(scriptLoader, requestSender),
                new VisaCheckoutScriptLoader(scriptLoader),
                formPoster,
            ),
    );

    registry.register(
        'chasepay',
        () =>
            new ChasePayCustomerStrategy(
                store,
                paymentMethodActionCreator,
                remoteCheckoutActionCreator,
                new ChasePayScriptLoader(scriptLoader),
                requestSender,
                formPoster,
            ),
    );

    registry.register(
        'squarev2',
        () =>
            new SquareCustomerStrategy(
                store,
                new RemoteCheckoutActionCreator(remoteCheckoutRequestSender, checkoutActionCreator),
            ),
    );

    registry.register(
        'masterpass',
        () =>
            new MasterpassCustomerStrategy(
                store,
                paymentMethodActionCreator,
                remoteCheckoutActionCreator,
                new MasterpassScriptLoader(scriptLoader),
                locale,
            ),
    );

    registry.register(
        'googlepayauthorizenet',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayAuthorizeNetInitializer()),
                formPoster,
            ),
    );

    registry.register(
        'googlepaybnz',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayBNZInitializer()),
                formPoster,
            ),
    );

    registry.register(
        'googlepaycheckoutcom',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(
                    store,
                    new GooglePayCheckoutcomInitializer(requestSender),
                ),
                formPoster,
            ),
    );

    registry.register(
        'googlepaycybersourcev2',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayCybersourceV2Initializer()),
                formPoster,
            ),
    );

    registry.register(
        'googlepayorbital',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayOrbitalInitializer()),
                formPoster,
            ),
    );

    registry.register(
        'googlepaystripe',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayStripeInitializer()),
                formPoster,
            ),
    );

    registry.register(
        'googlepaystripeupe',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayStripeUPEInitializer()),
                formPoster,
            ),
    );

    registry.register(
        'googlepayworldpayaccess',
        () =>
            new GooglePayCustomerStrategy(
                store,
                remoteCheckoutActionCreator,
                createGooglePayPaymentProcessor(store, new GooglePayWorldpayAccessInitializer()),
                formPoster,
            ),
    );

    registry.register('default', () => new DefaultCustomerStrategy(store, customerActionCreator));

    return registry;
}
