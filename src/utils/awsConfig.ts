import { Amplify } from 'aws-amplify';

const awsConfig = {
    Auth: {
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
        userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    },
    API: {
        GraphQL: {
            endpoint: process.env.NEXT_PUBLIC_APPSYNC_API_URL,
            region: process.env.NEXT_PUBLIC_AWS_REGION,
        }
    }
};

Amplify.configure(awsConfig);

export default awsConfig;