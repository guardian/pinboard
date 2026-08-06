import JestEnvironment from "jest-environment-node";

class FixedJestEnvironment extends JestEnvironment {
  constructor(...args: unknown[]) {
    // @ts-expect-error -- complaining about this being an array of unknown size instead of a tuple
    super(...args);

    this.global.performance = performance;
  }
}

export default FixedJestEnvironment;
