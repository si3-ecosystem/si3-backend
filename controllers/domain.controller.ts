// src/controllers/domain.controller.ts
import axios from 'axios'
import { Request, Response } from 'express'
import UserModel, { IUser } from '../models/usersModel'
import WebContent, { IWebContent } from '../models/WebContent.model'

// Environment variables (asserted non-null)
const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY!
const NAMESTONE_API_URL = process.env.NAMESTONE_API_URL!
const ADDRESS = process.env.ADDRESS!
const DOMAIN = process.env.DOMAIN!

const errorResponse = (res: Response, status: number, message: string): Response =>
  res.status(status).json({ message })

interface PublishDomainRequest extends Request {
  user?: IUser
  body: { domain?: string }
}

export const publishDomain = async (
  req: PublishDomainRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 401, 'Authentication required');
      return;
    }

    const { domain } = req.body

    if (!domain) {
      errorResponse(res, 400, 'Domain is required.');
      return;
    }

    // Check if subdomain is already taken
    const existingUser: IUser | null = await UserModel.findOne({ domain }).exec()
    if (existingUser) {
      errorResponse(res, 400, 'Subdomain already registered.');
      return;
    }

    // Ensure content is published
    const webpage: IWebContent | null = await WebContent.findOne({ user: req.user._id }).exec()
    const cid = webpage?.contentHash ?? ''
    if (!cid) {
      console.log('[publishDomain] No content hash found for user:', req.user._id)
      errorResponse(
        res,
        400,
        'Before selecting your domain name, please publish your webpage first.'
      );
      return;
    }

    // Register subdomain on external service
    const success = await registerSubdomain(domain, cid)
    if (!success) {
      errorResponse(res, 400, 'Could not register subdomain.');
      return;
    }

    // Update user record
    const updatedUser: IUser | null = await UserModel.findByIdAndUpdate(
      req.user._id,
      { domain },
      { new: true }
    ).exec()

    if (!updatedUser) {
      errorResponse(res, 404, 'User not found.');
      return;
    }

    res
      .status(200)
      .json({ domain: `${updatedUser.domain}.siher.eth.link` });
  } catch (error: any) {
    console.error('[publishDomain] Error:', error)
    errorResponse(
      res,
      500,
      error.message ?? 'Failed to publish domain'
    );
  }
}

/**
 * Registers a subdomain via the Namestone API.
 * @param subdomain - chosen subdomain
 * @param contenthash - IPFS content hash (without protocol)
 * @returns true if registration succeeded, false otherwise
 */
export const registerSubdomain = async (
  subdomain: string,
  contenthash: string
): Promise<boolean> => {
  try {
    console.log(
      '[registerSubdomain] Registering subdomain:',
      subdomain,
      'with contenthash:',
      contenthash
    )
    const response = await axios.post(
      NAMESTONE_API_URL,
      {
        domain:      DOMAIN,
        address:     ADDRESS,
        contenthash: `ipfs://${contenthash}`,
        name:        subdomain,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization:   NAMESTONE_API_KEY,
        },
      }
    )
    console.log('[registerSubdomain] API response status:', response.status)
    return response.status === 200
  } catch (err: any) {
    console.error(
      '[registerSubdomain] Error registering subdomain:',
      err.response?.data || err.message
    )
    return false
  }
}