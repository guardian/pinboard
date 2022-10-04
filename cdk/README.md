## `cdk`

The cdk module contains all of our infrastructure definitions. Unfortunately [`@guardian/cdk`](https://github.com/guardian/cdk) wasn't mature at the time the bulk of this CDK code was written, so it just uses standard CDK constructs in TypeScript (which is still infinitely better than writing CloudFormation). It includes a `build` yarn script to make it easy to generate some cloud formation JSON in the `cdk.out` directory (which is done at CI time), so it can be cloudformed with [Riff-Raff](https://github.com/guardian/riff-raff).

_Right now everything is one main file `stack.ts`, which is due a refactor to break it up, find abstractions and use [`@guardian/cdk`](https://github.com/guardian/cdk) where possible._
