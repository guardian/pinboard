import { AuthenticatedRequest, authMiddleware } from "./auth-middleware";
import { Response } from "express";
import { userHasPermission } from "../permissionCheck";
import { getVerifiedUserEmail } from "../panDomainAuth";
import { mocked } from "ts-jest/utils";

jest.mock("../permissionCheck");
jest.mock("../panDomainAuth");

const mockedGetVerifiedUserEmail = mocked(getVerifiedUserEmail, true);
const mockedUserHasPermission = mocked(userHasPermission, true);

const mockNextFunction = jest.fn();

describe("auth-middleware", () => {
  beforeAll(() => {
    jest.resetAllMocks();
  });

  test("should return a 401 response where no cookie provided", async () => {
    const mockRequest = ({
      header: jest.fn().mockReturnValue(undefined),
      userEmail: undefined,
    } as unknown) as AuthenticatedRequest;

    const mockResponse = ({
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown) as Response;
    await authMiddleware(mockRequest, mockResponse, mockNextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockNextFunction).not.toHaveBeenCalled();
  });

  test("should return a 403 response where user does not have permission", async () => {
    const mockRequest = ({
      header: jest.fn().mockReturnValue({ Cookie: "foo@bar.com" }),
      userEmail: undefined,
    } as unknown) as AuthenticatedRequest;

    const mockSendFunction = jest.fn();
    const mockResponse = ({
      status: jest.fn().mockReturnValue({
        send: mockSendFunction,
      }),
    } as unknown) as Response;

    mockedGetVerifiedUserEmail.mockResolvedValueOnce("foo@bar.com");

    mockedUserHasPermission.mockResolvedValueOnce(false);
    await authMiddleware(mockRequest, mockResponse, mockNextFunction);
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockSendFunction).toHaveBeenCalledWith(
      "You do not have permission to use PinBoard"
    );
    expect(mockNextFunction).not.toHaveBeenCalled();
    expect(mockRequest.userEmail).toBeUndefined();
  });

  test("calls next where user authenticated & authorised", async () => {
    const mockRequest = ({
      header: jest.fn().mockReturnValue({ Cookie: "foo@bar.com" }),
      userEmail: undefined,
    } as unknown) as AuthenticatedRequest;

    const mockResponse = ({
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    } as unknown) as Response;
    mockedGetVerifiedUserEmail.mockResolvedValueOnce("foo@bar.com");
    mockedUserHasPermission.mockResolvedValueOnce(true);
    await authMiddleware(mockRequest, mockResponse, mockNextFunction);
    expect(mockRequest.userEmail).toBe("foo@bar.com");
    expect(mockNextFunction).toHaveBeenCalledTimes(1);
  });
});
