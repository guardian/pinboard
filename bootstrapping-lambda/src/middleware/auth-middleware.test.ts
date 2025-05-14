import { AuthenticatedRequest, getAuthMiddleware } from "./auth-middleware";
import { Response } from "express";
import { userHasPermission } from "../../../shared/permissions";
import { getVerifiedUserEmail } from "../panDomainAuth";
import { mocked } from "jest-mock";

jest.mock("../../../shared/permissions");
jest.mock("../panDomainAuth");

const mockedGetVerifiedUserEmail = mocked(getVerifiedUserEmail, {
  shallow: true,
});
const mockedUserHasPermission = mocked(userHasPermission, { shallow: true });

const mockNextFunction = jest.fn();

describe("auth-middleware", () => {
  beforeAll(() => {
    jest.resetAllMocks();
  });

  test("should return a 401 response where no cookie provided", async () => {
    const mockRequest = {
      header: jest.fn().mockReturnValue(undefined),
      userEmail: undefined,
    } as unknown as AuthenticatedRequest;

    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown as Response;
    await getAuthMiddleware()(mockRequest, mockResponse, mockNextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockNextFunction).not.toHaveBeenCalled();
  });

  test("should return a 200 response where no cookie provided and sendErrorAsOk is true", async () => {
    const mockRequest = {
      header: jest.fn().mockReturnValue(undefined),
      userEmail: undefined,
    } as unknown as AuthenticatedRequest;

    const mockResponse = {
      status: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    await getAuthMiddleware(true)(mockRequest, mockResponse, mockNextFunction);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.send).toHaveBeenCalledWith(
      "console.error('pan-domain auth cookie missing, invalid or expired')"
    );
    expect(mockNextFunction).not.toHaveBeenCalled();
  });

  test("should return a 403 response where user does not have permission", async () => {
    const mockRequest = {
      header: jest.fn().mockReturnValue({ Cookie: "foo@bar.com" }),
      userEmail: undefined,
    } as unknown as AuthenticatedRequest;

    const mockSendFunction = jest.fn();
    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: mockSendFunction,
      }),
    } as unknown as Response;

    mockedGetVerifiedUserEmail.mockResolvedValueOnce("foo@bar.com");

    mockedUserHasPermission.mockResolvedValueOnce(false);
    await getAuthMiddleware()(mockRequest, mockResponse, mockNextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockSendFunction).toHaveBeenCalledWith(
      "You do not have permission to use PinBoard"
    );
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockRequest.userEmail).toBeUndefined();
  });

  test("should return a 200 response where user does not have permission and sendErrorAsOk is true", async () => {
    const mockRequest = {
      header: jest.fn().mockReturnValue({ Cookie: "foo@bar.com" }),
      userEmail: undefined,
    } as unknown as AuthenticatedRequest;

    const mockSendFunction = jest.fn();
    const mockResponse = {
      status: jest.fn(),
      send: mockSendFunction,
    } as unknown as Response;

    mockedGetVerifiedUserEmail.mockResolvedValueOnce("foo@bar.com");

    mockedUserHasPermission.mockResolvedValueOnce(false);
    await getAuthMiddleware(true)(mockRequest, mockResponse, mockNextFunction);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockSendFunction).toHaveBeenCalledWith(
      "console.log('You do not have permission to use PinBoard')"
    );
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockRequest.userEmail).toBeUndefined();
  });

  test("calls next where user authenticated & authorised", async () => {
    const mockRequest = {
      header: jest.fn().mockReturnValue({ Cookie: "foo@bar.com" }),
      userEmail: undefined,
    } as unknown as AuthenticatedRequest;

    const mockResponse = {
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown as Response;
    mockedGetVerifiedUserEmail.mockResolvedValueOnce("foo@bar.com");
    mockedUserHasPermission.mockResolvedValueOnce(true);
    await getAuthMiddleware()(mockRequest, mockResponse, mockNextFunction);
    expect(mockRequest.userEmail).toBe("foo@bar.com");
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockNextFunction).toHaveBeenCalledTimes(1);
  });
});
