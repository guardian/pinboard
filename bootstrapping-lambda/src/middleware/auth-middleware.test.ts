import { AuthenticatedRequest, getAuthMiddleware } from "./auth-middleware";
import { Response } from "express";
import { userHasPermission } from "../../../shared/permissions";
import { mocked } from "jest-mock";
import type {
  AuthenticationResult,
  PanDomainAuthentication,
  User,
} from "@guardian/pan-domain-node";

// factory avoids loading the real module, which fetches from S3 on import
jest.mock("../../../shared/permissions", () => ({
  userHasPermission: jest.fn(),
}));

const mockedUserHasPermission = mocked(userHasPermission, { shallow: true });

const mockNextFunction = jest.fn();

const COOKIE_HEADER = "gutoolsAuth-assym=some-cookie-value";

const testUser: User = {
  firstName: "Foo",
  lastName: "Bar",
  email: "test.user@theguardian.com",
  authenticatingSystem: "test",
  authenticatedIn: ["test"],
  expires: Date.now() + 60_000,
  multifactor: true,
};

const fakePanda = (result: AuthenticationResult) =>
  ({
    verify: jest.fn().mockResolvedValue(result),
  } as unknown as PanDomainAuthentication);

const authenticatedPanda = () =>
  fakePanda({ success: true, shouldRefreshCredentials: false, user: testUser });

const unauthenticatedPanda = () =>
  fakePanda({ success: false, reason: "no-cookie" });

const requestWithCookie = (cookieHeader: string | undefined) =>
  ({
    header: jest.fn().mockReturnValue(cookieHeader),
    userEmail: undefined,
  } as unknown as AuthenticatedRequest);

describe("auth-middleware", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should return a 401 response where no cookie provided", async () => {
    const mockRequest = requestWithCookie(undefined);
    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown as Response;
    const panda = authenticatedPanda();

    await getAuthMiddleware(panda)(mockRequest, mockResponse, mockNextFunction);
    expect(panda.verify).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockNextFunction).not.toHaveBeenCalled();
  });

  test("should return a 200 response where no cookie provided and sendErrorAsOk is true", async () => {
    const mockRequest = requestWithCookie(undefined);
    const mockResponse = {
      status: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    await getAuthMiddleware(authenticatedPanda(), true)(
      mockRequest,
      mockResponse,
      mockNextFunction
    );
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).toHaveBeenCalledWith(
      "console.error('pan-domain auth cookie missing, invalid or expired')"
    );
    expect(mockNextFunction).not.toHaveBeenCalled();
  });

  test("should return a 401 response where panda rejects the cookie", async () => {
    const mockRequest = requestWithCookie(COOKIE_HEADER);
    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown as Response;
    const panda = unauthenticatedPanda();

    await getAuthMiddleware(panda)(mockRequest, mockResponse, mockNextFunction);
    expect(panda.verify).toHaveBeenCalledWith(COOKIE_HEADER);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockedUserHasPermission).not.toHaveBeenCalled();
  });

  test("should return a 401 response where panda returns a user but fails validation", async () => {
    const mockRequest = requestWithCookie(COOKIE_HEADER);
    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown as Response;
    const panda = fakePanda({
      success: false,
      reason: "invalid-user",
      user: testUser,
    });

    await getAuthMiddleware(panda)(mockRequest, mockResponse, mockNextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockRequest.userEmail).toBeUndefined();
  });

  test("should not call next where panda verification throws", async () => {
    const mockRequest = requestWithCookie(COOKIE_HEADER);
    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown as Response;
    const panda = {
      verify: jest.fn().mockRejectedValue(new Error("S3 unavailable")),
    } as unknown as PanDomainAuthentication;

    await expect(
      getAuthMiddleware(panda)(mockRequest, mockResponse, mockNextFunction)
    ).rejects.toThrow("S3 unavailable");
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockRequest.userEmail).toBeUndefined();
  });

  test("should return a 403 response where user does not have permission", async () => {
    const mockRequest = requestWithCookie(COOKIE_HEADER);
    const mockSendFunction = jest.fn();
    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: mockSendFunction,
      }),
    } as unknown as Response;

    mockedUserHasPermission.mockResolvedValueOnce(false);
    await getAuthMiddleware(authenticatedPanda())(
      mockRequest,
      mockResponse,
      mockNextFunction
    );
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockSendFunction).toHaveBeenCalledWith(
      "You do not have permission to use PinBoard"
    );
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockRequest.userEmail).toBeUndefined();
  });

  test("should return a 200 response where user does not have permission and sendErrorAsOk is true", async () => {
    const mockRequest = requestWithCookie(COOKIE_HEADER);
    const mockSendFunction = jest.fn();
    const mockResponse = {
      status: jest.fn(),
      send: mockSendFunction,
    } as unknown as Response;

    mockedUserHasPermission.mockResolvedValueOnce(false);
    await getAuthMiddleware(authenticatedPanda(), true)(
      mockRequest,
      mockResponse,
      mockNextFunction
    );
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockSendFunction).toHaveBeenCalledWith(
      "console.log('You do not have permission to use PinBoard')"
    );
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockRequest.userEmail).toBeUndefined();
  });

  test("calls next where user authenticated & authorised", async () => {
    const mockRequest = requestWithCookie(COOKIE_HEADER);
    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown as Response;

    mockedUserHasPermission.mockResolvedValueOnce(true);
    await getAuthMiddleware(authenticatedPanda())(
      mockRequest,
      mockResponse,
      mockNextFunction
    );
    expect(mockedUserHasPermission).toHaveBeenCalledWith(
      "test.user@theguardian.com",
      expect.anything()
    );
    expect(mockRequest.userEmail).toBe("test.user@theguardian.com");
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockNextFunction).toHaveBeenCalledTimes(1);
  });
});
