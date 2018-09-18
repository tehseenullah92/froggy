let accuweatherSimple;

describe("accuweatherSimple", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    jest.unmock("request-promise-native");
  });

  describe("when no has cache", () => {
    beforeEach(() => {
      config.cacheTime = 0;
    });

    it("should call getLocationKey and return a key", () => {
      makeMockRequest(makeMockFn(mockLocationKey));
      accuweatherSimple = require("../index")(config);

      return accuweatherSimple.getLocationKey("city").then(result => {
        expect(result).toBe(mockLocationKey[0].Key);
      });
    });

    it("should call getOneDayWeather and return weather text", () => {
      makeMockRequest(makeMockFn(mockWeatherText));
      accuweatherSimple = require("../index")(config);

      return accuweatherSimple.getOneDayWeather("1234").then(result => {
        expect(result).toBe(mockWeatherText.Headline.Text);
      });
    });
  });

  describe("when has cache", () => {
    beforeAll(() => {
      config.cacheTime = 1000 * 60 * 60;
    });

    it("should no call the api twice", () => {
      const mockFn = makeMockFn(mockWeatherText);
      const mockRequest = makeMockRequest(mockFn);
      accuweatherSimple = require("../index")(config);

      return accuweatherSimple.getOneDayWeather("1234").then(() => {
        return accuweatherSimple.getOneDayWeather("1234").then(() => {
          expect(mockFn.mock.calls.length).toBe(1);
        });
      });
    });
  });
});

const config = {
  apikey: "ORgYqevm4owGUsfXdDIZm43sDjl3Exk8",
  language: "en-us",
  details:true
};
const mockLocationKey = [{ Key: "something" }];
const mockWeatherText = { Headline: { Text: "my weather" } };
const makeMockRequest = mockFn =>
  jest.mock("request-promise-native", () => mockFn);
const makeMockFn = mockData => jest.fn(() => Promise.resolve(mockData));
