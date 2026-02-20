// Lambda Authorizer — Firebase ID Token 검증
// architecture.md §7 Security 기반

import type { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda'
import { verifyIdToken } from '../lib/firebaseAdmin'

export async function handler(
  event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> {
  const token = event.authorizationToken?.replace('Bearer ', '')

  if (!token) return deny('anonymous', event.methodArn)

  try {
    const decoded = await verifyIdToken(token)
    return allow(decoded.uid, event.methodArn, { uid: decoded.uid })
  } catch {
    return deny('anonymous', event.methodArn)
  }
}

function allow(
  principalId: string,
  arn: string,
  context?: Record<string, string>,
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: 'Allow', Resource: arn }],
    },
    context,
  }
}

function deny(principalId: string, arn: string): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Action: 'execute-api:Invoke', Effect: 'Deny', Resource: arn }],
    },
  }
}
