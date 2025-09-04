import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

type ChainbaseEnsResponse = {
  data?: {
    name?: string;
    address?: string;
    registrant?: string;
    owner?: string;
    resolver?: string;
    registrant_time?: string;
    expiration_time?: string;
    token_id?: string;
    text_records?: Record<string, string>;
  } | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const chain_id = searchParams.get('chain_id') ?? '1'; // ENS lives on mainnet

    if (!domain) {
      return NextResponse.json(
        { error: 'Missing required param: domain' },
        { status: 400 }
      );
    }

    const apiKey = process.env.CHAINBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'CHAINBASE_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    // Chainbase docs:
    // GET https://api.chainbase.online/v1/ens/records?chain_id=1&domain=<name>
    const url = `https://api.chainbase.online/v1/ens/records?chain_id=${encodeURIComponent(
      chain_id
    )}&domain=${encodeURIComponent(domain)}`;

    const { data } = await axios<ChainbaseEnsResponse>({
      url,
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        accept: 'application/json',
      },
      // a short timeout keeps the UI snappy; adjust if you want
      timeout: 10_000,
    });

    const payload = data?.data || null;

    if (!payload?.address) {
      return NextResponse.json(
        { error: 'No address found for this ENS name.' },
        { status: 404 }
      );
    }

    // return only what we need + a couple of niceties
    return NextResponse.json({
      name: payload.name,
      address: payload.address,
      avatar: payload.text_records?.avatar ?? null,
    });
  } catch (err: any) {
    const status =
      err?.response?.status ??
      (err?.code === 'ECONNABORTED' ? 504 : 500);

    return NextResponse.json(
      {
        error:
          err?.response?.data?.error ??
          err?.message ??
          'Failed to resolve ENS name',
      },
      { status }
    );
  }
}
