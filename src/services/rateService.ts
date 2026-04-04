import api from "./api";

export interface CardRate {
  id: string;
  card_brand_id: string;
  brand_name: string;
  brand_logo: string;
  card_type: string;
  denomination: string;
  rate_per_dollar: number;
  is_active: boolean;
}

export const rateService = {
  getAll: () =>
    api.get<CardRate[]>("/rates"),

  getByBrand: (brandId: string) =>
    api.get<CardRate[]>(`/rates/${brandId}`),
};
